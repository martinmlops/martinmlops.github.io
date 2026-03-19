---
title: "Azure OpenAI 대화형 AI - Chat History 관리와 컨텍스트 유지"
date: 2026-01-19
categories: [AI, LLM]
tags: [Azure OpenAI, LangChain, Chat History, 대화형 AI, SystemMessage, HumanMessage, AIMessage]
toc: true
toc_sticky: true
---

## 개요

Azure OpenAI와 LangChain을 활용하여 대화 히스토리를 관리하는 AI 시스템을 구현합니다. 연속적인 대화에서 이전 맥락을 기억하고 자연스러운 상호작용을 가능하게 하는 핵심 기술을 다룹니다.

---

## 1. 대화 히스토리의 필요성

LLM은 기본적으로 **무상태(Stateless)** 입니다. 매 요청마다 이전 대화를 기억하지 못하므로, 개발자가 직접 대화 이력을 관리해야 합니다.

### 대화 히스토리 없이 호출하면?

```
사용자: 4칙연산 코드 작성해줘
AI: (4칙연산 코드 제공)

사용자: 여기서 제곱 기능도 추가해줘
AI: "여기서"가 무엇을 의미하는지 모릅니다...
```

### 대화 히스토리를 관리하면?

```
사용자: 4칙연산 코드 작성해줘
AI: (4칙연산 코드 제공)

사용자: 여기서 제곱 기능도 추가해줘
AI: (이전 4칙연산 코드에 제곱 기능을 추가한 코드 제공)
```

---

## 2. LangChain 메시지 클래스

LangChain은 대화 히스토리 관리를 위해 3가지 메시지 타입을 제공합니다.

```python
from langchain.messages import SystemMessage, HumanMessage, AIMessage
```

| 메시지 타입 | 역할 | 설명 |
|---|---|---|
| `SystemMessage` | AI 역할 정의 | 대화 전체에 적용되는 페르소나/행동 지침 |
| `HumanMessage` | 사용자 입력 | 사용자의 질문이나 요청 |
| `AIMessage` | AI 응답 | AI가 생성한 응답 (히스토리에 저장) |

---

## 3. Azure OpenAI 클라이언트 설정

```python
from langchain_openai import AzureChatOpenAI

llm = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment="<YOUR_DEPLOYMENT_NAME>",
    azure_endpoint="<YOUR_AZURE_ENDPOINT>",
    api_key="<YOUR_API_KEY>",
    temperature=0.8,
    max_tokens=1000,
    top_p=0.8,
    request_timeout=60,
    max_retries=3
)
```

> ⚠️ **보안 주의**: API 키와 엔드포인트는 환경변수나 Azure Key Vault를 통해 관리하세요.

---

## 4. 대화 히스토리 구현

### 메시지 리스트 초기화

```python
messages = []
```

### 시스템 프롬프트 설정

```python
system_prompt = '''
당신은 Python 프로그래밍 전문가 AI 어시스턴트입니다.

## 핵심 역량
- 명확하고 읽기 쉬운 Python 코드 작성 (PEP 8 준수)
- 코드 분석: 시간/공간 복잡도, 잠재적 버그 식별
- 디버깅 전략 및 예외 처리 안내
- 성능 최적화 및 리팩토링 가이드

## 응답 원칙
1. 명확성: 이해하기 쉬운 코드와 설명
2. 완전성: 실행 가능한 완전한 코드 예제
3. 교육적: 작동 원리와 개념 설명
4. 안전성: 보안 취약점 없는 코드
'''

messages.append(SystemMessage(content=system_prompt))
```

### 첫 번째 대화

```python
user_prompt = '간단한 4칙연산 코드 작성해줘.'

messages.append(HumanMessage(content=user_prompt))
result = llm.invoke(messages)
messages.append(AIMessage(content=result.content))
```

AI가 타입 힌트와 docstring을 포함한 완전한 4칙연산 함수를 제공합니다:

```python
from typing import Tuple

def four_operations(a: float, b: float) -> Tuple[float, float, float, float | None]:
    add_result = a + b
    sub_result = a - b
    mul_result = a * b
    div_result = a / b if b != 0 else None
    return add_result, sub_result, mul_result, div_result
```

### 후속 대화 (컨텍스트 유지)

```python
user_prompt = '여기서 추가적으로 제곱 기능도 추가 가능해?'

messages.append(HumanMessage(content=user_prompt))
result = llm.invoke(messages)
messages.append(AIMessage(content=result.content))
```

AI가 **"여기서"** 라는 모호한 표현을 정확히 이해하고, 이전 4칙연산 코드를 기반으로 제곱 연산(`**`)을 추가한 확장 버전을 제공합니다.

---

## 5. 대화 히스토리 구조

두 번의 대화 후 `messages` 리스트의 구조:

```
[0] SystemMessage  → Python 전문가 역할 정의
[1] HumanMessage   → "4칙연산 코드 작성해줘"
[2] AIMessage      → 4칙연산 코드 응답
[3] HumanMessage   → "제곱 기능도 추가 가능해?"
[4] AIMessage      → 제곱 기능 추가된 코드 응답
```

매 호출 시 전체 메시지 리스트가 API로 전송되므로, AI는 이전 대화 맥락을 완전히 파악할 수 있습니다.

---

## 6. 메모리 관리 고려사항

### 토큰 제한

대화가 길어질수록 토큰 사용량이 증가합니다. 모델별 최대 토큰 수를 초과하지 않도록 관리가 필요합니다.

### 관리 전략

| 전략 | 설명 | 적합한 상황 |
|---|---|---|
| 윈도우 방식 | 최근 N개 메시지만 유지 | 일반적인 챗봇 |
| 요약 방식 | 오래된 대화를 요약으로 압축 | 긴 대화 세션 |
| 토큰 카운팅 | 토큰 수 기준으로 관리 | 비용 최적화 |

```python
# 윈도우 방식 예시: 최근 10개 메시지만 유지
MAX_MESSAGES = 10

if len(messages) > MAX_MESSAGES + 1:  # +1은 SystemMessage
    messages = [messages[0]] + messages[-(MAX_MESSAGES):]
```

---

## 정리

- LLM은 무상태이므로 **대화 히스토리를 직접 관리**해야 함
- LangChain의 `SystemMessage`, `HumanMessage`, `AIMessage`로 구조화된 대화 관리
- 매 호출 시 전체 메시지 리스트를 전송하여 **컨텍스트 유지**
- 토큰 제한을 고려한 **메모리 관리 전략** 필수
- API 키 등 민감 정보는 반드시 환경변수 또는 Key Vault로 관리
