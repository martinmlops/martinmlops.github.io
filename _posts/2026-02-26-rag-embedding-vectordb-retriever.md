---
title: "RAG 실전 - Embedding, Vector DB, Retriever 비교"
date: 2026-02-26
categories: [AI, RAG]
tags: [RAG, Embedding, ChromaDB, Vector Database, Retriever, Similarity, MMR, LangChain, Azure OpenAI]
toc: true
toc_sticky: true
---

## 개요

RAG 시스템의 핵심 구성요소인 Embedding, Vector Database(ChromaDB), 그리고 3가지 Retriever 방법(Similarity, MMR, Threshold)을 비교 실습합니다. LCEL(LangChain Expression Language)을 사용한 RAG Chain 구성까지 다룹니다.

---

## 1. Embedding 기초

### Embedding이란?

텍스트를 숫자 벡터로 변환하는 과정입니다.

- `"안녕하세요"` → `[0.1, -0.3, 0.7, ...]` (1536차원 벡터)
- 의미가 비슷한 텍스트는 비슷한 벡터를 가짐
- 벡터 간 거리로 의미적 유사도를 계산

### 왜 Embedding이 필요한가?

1. **의미 검색**: 단순 키워드가 아닌 의미로 검색
2. **다국어 지원**: 언어가 달라도 의미가 같으면 유사한 벡터
3. **문맥 이해**: 같은 단어라도 문맥에 따라 다른 벡터

### Azure OpenAI Embedding 설정

```python
from langchain_openai import AzureOpenAIEmbeddings

embeddings = AzureOpenAIEmbeddings(
    model="text-embedding-3-small",
    azure_endpoint="<YOUR_AZURE_ENDPOINT>",
    api_key="<YOUR_API_KEY>",
    api_version="2024-02-15-preview",
)

# 텍스트를 벡터로 변환
vector = embeddings.embed_query("Embedding을 위한 테스트입니다.")
print(f"벡터 차원: {len(vector)}")   # 1536
print(f"벡터 타입: {type(vector)}")  # <class 'list'>
print(f"벡터 범위: {min(vector):.4f} ~ {max(vector):.4f}")
# 벡터 범위: -0.1216 ~ 0.1731
```

---

## 2. Vector Database (ChromaDB)

### ChromaDB 선택 이유

- pip install만으로 설치 완료
- 별도 서버 없이 로컬 실행
- LangChain과 완벽 호환
- 오픈소스 무료

### 데이터 삽입 파이프라인

하이브리드 청킹 접근법을 사용합니다: HTML 구조로 의미 단위 분할 후, 큰 조각은 길이 기반으로 재분할합니다.

```python
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter, HTMLSectionSplitter
from langchain_community.document_loaders import WebBaseLoader

# 1단계: 웹 문서 로드
loader = WebBaseLoader("https://learn.microsoft.com/ko-kr/entra/fundamentals/identity-fundamental-concepts")
html_docs = loader.load()
print(f"문서 길이: {len(html_docs[0].page_content)} 문자")

# 2단계: 하이브리드 청킹
headers_to_split_on = [("h1", "Header 1"), ("h2", "Header 2"), ("h3", "Header 3")]
html_splitter = HTMLSectionSplitter(headers_to_split_on)
html_splits = html_splitter.split_documents(html_docs)
print(f"HTML 구조 분할: {len(html_splits)}개 조각")

text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
final_splits = text_splitter.split_documents(html_splits)
print(f"최종 분할: {len(final_splits)}개 조각")
print(f"평균 조각 크기: {sum(len(d.page_content) for d in final_splits) / len(final_splits):.0f} 문자")

# 3단계: 벡터 DB에 저장
vectorstore = Chroma.from_documents(
    documents=final_splits,
    collection_name="sample_collection",
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

### 유사도 검색 테스트

```python
query = "ID 공급자가 뭐야?"
docs = vectorstore.similarity_search(query, k=3)

for i, doc in enumerate(docs):
    print(f"문서 {i+1}: {doc.page_content[:150]}...")
```

---

## 3. RAG Chain 구성

### LCEL 방식 RAG 파이프라인

```python
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# LLM 설정
llm = AzureChatOpenAI(
    azure_deployment="<YOUR_DEPLOYMENT_NAME>",
    azure_endpoint="<YOUR_AZURE_ENDPOINT>",
    api_key="<YOUR_API_KEY>",
    temperature=0.1,
    max_tokens=8092,
)

# 프롬프트 템플릿
prompt = PromptTemplate(
    template="""
당신은 Azure AI 서비스 전문가입니다.

문맥: {context}
질문: {question}

답변 가이드라인:
- 주어진 문맥을 기반으로만 답변해주세요.
- 확실하지 않은 정보는 "문서에서 확인할 수 없습니다"라고 답변하세요.
- 한국어로 답변해주세요.
""",
    input_variables=["context", "question"]
)

# 문서 포맷팅 함수
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)
```

---

## 4. 다양한 Retriever 비교

### 방법 1: 유사도 검색 (Similarity Search)

가장 기본적인 검색 방법. 쿼리와 가장 유사한 문서를 반환합니다.

```python
retriever_similarity = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)

rag_chain = (
    {"context": retriever_similarity | format_docs, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)

answer = rag_chain.invoke("ID 식별자 종류에 대해 알려주세요.")
```

- ✅ 빠른 속도, 직관적
- ❌ 중복 결과 가능

---

### 방법 2: MMR (Maximum Marginal Relevance)

관련성과 다양성을 모두 고려하는 검색 방법입니다.

```python
retriever_mmr = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 3,
        "fetch_k": 10,
        "lambda_mult": 0.7   # 관련성 70%, 다양성 30%
    }
)
```

**lambda_mult 파라미터:**
- `1.0`: 관련성만 고려 (유사도 검색과 동일)
- `0.7`: 관련성 70%, 다양성 30% (권장)
- `0.0`: 다양성만 고려

- ✅ 다양한 관점 제공, 중복 방지
- ❌ 계산 비용 높음

---

### 방법 3: 임계값 기반 검색 (Similarity Score Threshold)

일정 유사도 이상의 문서만 반환합니다.

```python
retriever_threshold = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "score_threshold": 0.7,
        "k": 5
    }
)
```

**score_threshold:**
- `0.8~1.0`: 매우 엄격 (전문 분야)
- `0.6~0.8`: 적당히 엄격 (권장)
- `0.4~0.6`: 관대 (일반 질문)

- ✅ 품질 보장, 관련 없는 문서 필터링
- ❌ 결과 없을 수 있음

---

## 5. Retriever 종합 비교

| 방법 | 특징 | 장점 | 단점 | 사용 시기 |
|---|---|---|---|---|
| Similarity | 코사인 유사도 기반 | 빠르고 직관적 | 중복 결과 가능 | 일반적인 검색 |
| MMR | 관련성 + 다양성 | 다양한 관점 제공 | 계산 비용 높음 | 포괄적 답변 필요 |
| Threshold | 임계값 이상만 반환 | 품질 보장 | 결과 없을 수 있음 | 정확성 중요 |

---

## 6. 실무 가이드

### 검색 방법 선택

| 상황 | 추천 방법 |
|---|---|
| 일반적인 Q&A | Similarity |
| 복합적인 질문 | MMR |
| 전문 분야 (의료, 법률) | Threshold |
| 실시간 서비스 | Similarity |
| 연구/분석 | MMR |

### 파라미터 튜닝

**k (반환 문서 수):**
- k=1~2: 간단한 질문
- k=3~5: 일반적인 질문 (권장)
- k=5~10: 복잡한 질문

### 주의사항

1. **할루시네이션**: LLM이 없는 정보를 만들어낼 수 있음
2. **문서 품질**: 잘못된 문서 → 잘못된 답변
3. **토큰 제한**: 너무 많은 문서를 컨텍스트로 제공하면 토큰 초과
4. **비용 관리**: 임베딩과 LLM 호출 비용 고려

> ⚠️ **보안 주의**: API 키와 엔드포인트는 환경변수나 Azure Key Vault를 통해 관리하세요.
