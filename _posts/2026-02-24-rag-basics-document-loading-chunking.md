---
title: "RAG 기초 - Document Loading & Chunking 전략 완벽 가이드"
date: 2026-02-24
categories: [AI, RAG]
tags: [RAG, LangChain, Document Loader, Chunking, TextSplitter, PDF, CSV, JSON, HTML]
toc: true
toc_sticky: true
---

## 개요

RAG(Retrieval-Augmented Generation) 시스템의 첫 번째 단계인 **문서 로딩**과 **청킹(Chunking)** 을 학습합니다. 다양한 형식의 문서를 LangChain으로 로드하고, 최적의 크기로 분할하는 전략을 실습합니다.

---

## Part 1: Document Loading

### Document 객체란?

LangChain의 Document는 두 가지 주요 속성을 가집니다:
- **page_content**: 실제 텍스트 내용
- **metadata**: 소스, 페이지 번호, 생성일 등 메타정보

### 필수 패키지

```bash
pip install langchain langchain-openai langchain-text-splitters langchain-community langchain-core
pip install bs4 PyMuPDF jq  # 파일 형식별 추가 패키지
```

### 로더 클래스 임포트

```python
from langchain_community.document_loaders import (
    TextLoader,       # 일반 텍스트 파일 (.txt)
    CSVLoader,        # CSV 파일
    JSONLoader,       # JSON 파일
    PyMuPDFLoader,    # PDF 파일
    WebBaseLoader     # 웹페이지 (HTML)
)
```

---

### 1. TXT 파일 로딩

가장 기본적인 로더로, 파일 전체를 하나의 Document 객체로 변환합니다.

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("files/azure_ai_guide.txt", encoding='utf-8')
txt_docs = loader.load()

print(f"로드된 문서 수: {len(txt_docs)}")       # 1
print(f"문서 타입: {type(txt_docs[0])}")         # Document
print(txt_docs[0].page_content[:200])
print(txt_docs[0].metadata)
# {'source': 'files/azure_ai_guide.txt'}
```

> 한글 파일은 반드시 `encoding='utf-8'` 지정이 필요합니다.

**사용 시나리오:** 기술 문서, 매뉴얼, 소설, 로그 파일, 설정 파일

---

### 2. CSV 파일 로딩

각 행이 하나의 Document 객체로 변환됩니다. 헤더 행이 컬럼명으로 사용되며, 각 데이터 행의 컬럼값들이 `key: value` 형태로 조합되어 `page_content`에 저장됩니다.

```python
from langchain_community.document_loaders import CSVLoader

loader = CSVLoader("files/sample_products.csv", encoding='utf-8')
csv_docs = loader.load()
# 10개 행 → 10개 Document 객체

print(csv_docs[0].page_content)
# product_id: 1
# product_name: Azure AI Services
# category: Cloud Computing
# price: 299.99
# ...

print(csv_docs[0].metadata)
# {'source': 'files/sample_products.csv', 'row': 0}
```

**사용 시나리오:** 제품 카탈로그, 고객 데이터, FAQ, 지식베이스

---

### 3. JSON 파일 로딩

`jq_schema`를 사용해 특정 필드만 추출할 수 있습니다.

```python
from langchain_community.document_loaders import JSONLoader

loader = JSONLoader(
    file_path='files/research_papers.json',
    jq_schema='.',
    text_content=False,
)
json_docs = loader.load()
```

| jq_schema | 설명 |
|---|---|
| `'.'` | 전체 JSON 객체 |
| `'.[]'` | 배열의 각 요소 |
| `'.data.items[]'` | 중첩된 배열 접근 |

---

### 4. PDF 파일 로딩

각 페이지가 별도의 Document 객체로 생성됩니다. 메타데이터에 페이지 번호(`page`)가 자동 포함됩니다.

```python
from langchain_community.document_loaders import PyMuPDFLoader

loader = PyMuPDFLoader("files/sample.pdf")
pdf_docs = loader.load()
# 25페이지 → 25개 Document 객체

print(pdf_docs[0].metadata)
# {'source': 'files/sample.pdf', 'page': 0, 'total_pages': 25, ...}
```

> 이미지나 복잡한 레이아웃은 텍스트 추출이 어려울 수 있습니다. 텍스트만 추출되며, 표는 제외될 수 있습니다.

**사용 시나리오:** 기술 문서, 연구 논문, 보고서, 법률 문서, 계약서

---

### 5. HTML 웹페이지 로딩

```python
from langchain_community.document_loaders import WebBaseLoader

loader = WebBaseLoader("https://learn.microsoft.com/ko-kr/entra/fundamentals/identity-fundamental-concepts")
html_docs = loader.load()
```

> 동적 콘텐츠(JavaScript)는 로드되지 않을 수 있습니다.

---

## Part 2: Chunking 전략

### 왜 Chunking이 필요한가?

1. **토큰 제한**: LLM은 한 번에 처리할 수 있는 토큰 수가 제한
2. **검색 정확도**: 작은 조각이 더 정확한 검색 결과 제공
3. **비용 효율성**: 필요한 부분만 처리하여 비용 절약
4. **응답 품질**: 관련성 높은 정보만 선별

---

### 1. RecursiveCharacterTextSplitter (가장 추천)

텍스트의 자연스러운 구조를 유지하면서 분할합니다.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 각 조각의 최대 문자 수
    chunk_overlap=100    # 조각 간 겹치는 문자 수
)
chunks = text_splitter.split_documents(txt_docs)
```

**작동 원리:**
1. 문단 구분자(`\n\n`)로 분할 시도
2. 문장 구분자(`.`, `!`, `?`)로 분할
3. 단어 구분자(공백)로 분할
4. 최후에 문자 단위로 분할

---

### 2. Token 기반 분할

LLM의 토큰 제한을 정확히 맞춰야 할 때 사용합니다.

```python
from langchain_text_splitters import CharacterTextSplitter

text_token_splitter = CharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=500,
    chunk_overlap=100
)
token_texts = text_token_splitter.split_documents(txt_docs)
```

---

### 3. HTML 구조 기반 분할

HTML 태그의 계층 구조를 활용합니다.

```python
from langchain_text_splitters import HTMLSectionSplitter

headers_to_split_on = [
    ("h1", "Header 1"),
    ("h2", "Header 2"),
    ("h3", "Header 3"),
]

html_splitter = HTMLSectionSplitter(headers_to_split_on)
html_splits = html_splitter.split_documents(html_docs)
```

---

### 4. 하이브리드 접근법 (추천)

HTML 구조 분할 + 길이 기반 분할을 조합:

```python
# 1단계: HTML 구조 기반 분할
html_splitter = HTMLSectionSplitter(headers_to_split_on)
html_header_splits = html_splitter.split_documents(html_docs)

# 2단계: 큰 조각을 길이 기반으로 재분할
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)
final_splits = text_splitter.split_documents(html_header_splits)
```

---

## Chunking 전략 선택 가이드

| 문서 유형 | 추천 방법 | 이유 |
|---|---|---|
| 일반 텍스트 (소설, 기사) | RecursiveCharacterTextSplitter | 자연스러운 문단/문장 단위 유지 |
| 기술 문서 (API 문서) | HTML + Recursive 하이브리드 | 구조 정보 + 적절한 크기 |
| 웹 페이지 | HTMLSectionSplitter | HTML 구조 활용 |
| 대화형 AI | Token 기반 | 정확한 토큰 제어 필요 |
| 빠른 프로토타입 | Character 기반 | 간단하고 빠름 |

---

## 실무 파라미터 권장값

### chunk_size
- 일반적: 500-1000 문자
- 상세한 검색: 200-500 문자
- 긴 문맥 필요: 1000-2000 문자

### chunk_overlap
- 일반적: chunk_size의 10-20%
- 문맥 중요: chunk_size의 20-30%

---

## 주의사항

- **너무 작은 조각**: 문맥 정보 손실
- **너무 큰 조각**: 검색 정확도 저하
- **overlap 없음**: 경계 정보 손실
- **과도한 overlap**: 중복 정보로 인한 노이즈

> 다음 단계: 분할된 텍스트 조각들을 **임베딩(Embedding)** 으로 변환하여 벡터 데이터베이스에 저장합니다.
