---
title: "Azure 클라우드 네이티브 RAG 파이프라인 구축"
date: 2026-03-05
categories: [AI, RAG]
tags: [RAG, Azure OpenAI, Azure AI Search, Flask, LangChain, Vector DB, 대화형 AI, 파이프라인]
toc: true
toc_sticky: true
---

## 개요

Azure 클라우드 서비스를 기반으로 구축한 End-to-End RAG 파이프라인의 아키텍처와 구현을 다룹니다. PDF 문서를 학습하여 대화형 검색 서비스를 제공하는 실전 시스템입니다.

---

## 1. 시스템 아키텍처

### 기술 스택

| 구성요소 | 기술 | 역할 |
|---|---|---|
| Frontend | HTML5/Vanilla JS & CSS | 카카오톡 스타일 채팅 UI |
| Backend | Flask (Python) | 세션 기반 대화 관리 서버 |
| LLM | Azure OpenAI (GPT-4o) | 답변 생성 |
| Embeddings | Azure OpenAI (text-embedding-3-small) | 텍스트 벡터화 |
| Blob Storage | Azure Blob Storage | 원본 데이터 저장 |
| Vector DB | Azure AI Search | 벡터 인덱싱 및 검색 |
| Infrastructure | Azure Ubuntu VM | 호스팅 |

### 아키텍처 다이어그램

```
[사용자] → [Flask 서버] → [질문 재구성]
                              ↓
                    [Azure AI Search] ← [임베딩 벡터]
                              ↓
                    [관련 문서 검색]
                              ↓
                    [GPT-4o 답변 생성] → [사용자에게 응답]
```

---

## 2. 데이터 워크플로우

### 가. Ingestion Pipeline (데이터 주입)

```
PDF 생성 → Blob 업로드 → 문서 분할 → 임베딩 & 인덱싱
```

1. **지식 생성**: PDF 문서를 자동 생성
2. **Blob 업로드**: Azure Blob Storage로 전송
3. **문서 분할**: `RecursiveCharacterTextSplitter`로 1,000자 단위 청킹
4. **임베딩 및 저장**: `text-embedding-3-small`로 벡터화 후 Azure AI Search에 인덱싱

### 나. Conversational RAG (대화형 검색)

```
사용자 질문 → 질문 재구성 → 하이브리드 검색 → 페르소나 기반 응답
```

1. **질문 재구성**: 이전 대화 이력을 참고하여 독립적인 검색어로 재구성
2. **하이브리드 검색**: 벡터 검색 수행
3. **페르소나 기반 응답**: 시스템 프롬프트에 따른 전문적 답변 생성

---

## 3. 핵심 모듈 구현

### 커스텀 Retriever

Azure AI Search의 리트리버 버그를 우회하는 커스텀 클래스:

```python
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from pydantic import Field
from typing import List, Any

class AzureSearchRetriever(BaseRetriever):
    vector_store: Any = Field(exclude=True)
    k: int = 4

    def _get_relevant_documents(
        self, query: str, *, run_manager: Any = None, **kwargs: Any
    ) -> List[Document]:
        # k 중복 에러 방지를 위해 직접 hybrid_search 호출 및 kwargs 무시
        print(f"[Retriever] Searching for: {query}")
        return self.vector_store.hybrid_search(query, k=self.k)
```

> `AzureSearch`의 `as_retriever()` 메서드에서 `k` 인자가 내부적으로 중복 전달되는 버그가 있습니다. 이를 우회하기 위해 `BaseRetriever`를 상속받아 `hybrid_search`를 직접 호출하는 커스텀 리트리버를 구현했습니다. `kwargs`를 무시하여 중복 인자 문제를 원천 차단합니다.

---

### 질문 재구성 (Contextualization)

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever

contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", 
     "이전 대화 내용과 최신 사용자 질문이 주어졌을 때, "
     "검색 엔진에 입력하기 적합한 '짧고 독립적인 검색어'로 재구성하세요. "
     "질문에 직접 답하지 마세요."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)
```

---

### 답변 생성 체인

```python
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

system_prompt = (
    "당신은 전문 정보를 안내하는 AI 어시스턴트입니다. "
    "1. 제공된 Context를 최우선으로 참고하여 답변하세요. "
    "2. Context에 정보가 있다면 상세히 설명하세요. "
    "3. Context에 없는 경우 범용적 지식을 활용해 답변하세요. "
    "4. 답변은 친근하고 풍부한 정보를 담아 작성하세요.\n\n"
    "Context:\n{context}"
)

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
```

---

### Flask 서버 (세션 관리)

서버 메모리에 세션별 대화 이력을 딕셔너리로 관리합니다. RAG 체인은 싱글톤 패턴으로 초기화하여 매 요청마다 재생성하지 않습니다.

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_core.messages import HumanMessage, AIMessage

app = Flask(__name__)
CORS(app)

# RAG 체인 싱글톤
_rag_chain = None
# 세션별 대화 이력 저장 (서버 메모리)
chat_histories = {}

def get_chain():
    global _rag_chain
    if _rag_chain is None:
        from src.rag_agent import get_rag_chain
        _rag_chain = get_rag_chain()
    return _rag_chain

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True)
    session_id = data.get('session_id', 'default_session')
    question = data.get('question', '').strip()

    if session_id not in chat_histories:
        chat_histories[session_id] = []

    chain = get_chain()
    response = chain.invoke({
        "input": question,
        "chat_history": chat_histories[session_id]
    })
    answer = response["answer"]

    # 대화 이력 업데이트
    chat_histories[session_id].append(HumanMessage(content=question))
    chat_histories[session_id].append(AIMessage(content=answer))

    # 최근 10개 메시지만 유지 (토큰 관리 및 성능 목적)
    if len(chat_histories[session_id]) > 10:
        chat_histories[session_id] = chat_histories[session_id][-10:]

    return jsonify({'answer': answer})
```

**설계 포인트:**
- `HumanMessage`/`AIMessage` 객체로 대화 이력을 구조화하여 LangChain 체인에 직접 전달
- 세션당 최대 10개 메시지로 제한하여 토큰 초과 및 메모리 누수 방지
- `flask_cors`로 프론트엔드 크로스 오리진 요청 허용

---

## 4. Azure 서비스 설정

### Azure OpenAI

```python
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="<YOUR_EMBEDDING_DEPLOYMENT>",
    azure_endpoint="<YOUR_AZURE_ENDPOINT>",
    api_key="<YOUR_API_KEY>",
)

llm = AzureChatOpenAI(
    azure_deployment="<YOUR_CHAT_DEPLOYMENT>",
    azure_endpoint="<YOUR_AZURE_ENDPOINT>",
    api_key="<YOUR_API_KEY>",
    temperature=0
)
```

### Azure AI Search

```python
from langchain_community.vectorstores import AzureSearch

vector_store = AzureSearch(
    azure_search_endpoint="<YOUR_SEARCH_ENDPOINT>",
    azure_search_key="<YOUR_SEARCH_API_KEY>",
    index_name="<YOUR_INDEX_NAME>",
    embedding_function=embeddings.embed_query
)
```

> ⚠️ **보안 주의**: 모든 API 키와 엔드포인트는 `.env` 파일 또는 Azure Key Vault를 통해 관리하세요.

---

### 비밀 관리 (Config)

API 키와 엔드포인트는 `.env` 파일을 1순위로, Azure Key Vault를 2순위로 조회하는 계층적 비밀 관리 패턴을 적용합니다.

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

def get_secret(secret_name: str) -> str:
    """1순위: 로컬 환경 변수 (.env), 2순위: Azure Key Vault"""
    value = os.getenv(secret_name)
    if value:
        return value

    # Azure Key Vault 폴백
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=KEY_VAULT_URL, credential=credential)
    return client.get_secret(secret_name).value
```

로컬 개발 시에는 `.env` 파일로 빠르게 설정하고, 프로덕션(Azure VM)에서는 Key Vault를 통해 비밀을 안전하게 관리합니다.

---

## 5. 이슈 해결 기록

| 이슈 | 원인 | 해결 방법 |
|---|---|---|
| PDF 폰트 호환성 | macOS 기본 폰트(`AppleSDGothicNeo.ttc`) PostScript 미지원 | `Arial Unicode.ttf`로 교체 |
| 검색 성능 | `AzureSearch` 리트리버의 `k` 인자 중복 버그 | `BaseRetriever` 상속 커스텀 리트리버 구현 |
| 메모리 관리 | 대화 이력 무한 증가 | 세션당 최대 10개 메시지 제한 |
| 테마 전환 | 기업 규정 → 유튜버 정보 서비스 | Agent Prompt + UI strings 일괄 변경 |

---

## 6. 운영 가이드

### 데이터 업데이트
신규 PDF 생성 후 Ingestion 스크립트를 실행하여 인덱스를 갱신합니다.

### 로그 모니터링
VM 내 로그 파일을 통해 실시간 질의 및 검색 쿼리를 모니터링합니다.

### 인덱스 관리
인덱스 초기화가 필요한 경우 Azure Portal 또는 `SearchIndexClient`를 통해 삭제 후 재주입합니다.

---

## 정리

- Azure 클라우드 서비스 기반 **End-to-End RAG 파이프라인** 구축
- `RecursiveCharacterTextSplitter`로 1,000자 단위 청킹
- `text-embedding-3-small`로 벡터화 후 Azure AI Search에 인덱싱
- `create_history_aware_retriever`로 대화 맥락을 유지하는 검색
- Flask 서버에서 세션별 대화 이력 관리 (최대 10개 메시지)
- 커스텀 리트리버로 라이브러리 버그 우회
