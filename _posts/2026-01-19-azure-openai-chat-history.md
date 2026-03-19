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
AI: "여기서"가 무엇을 의미하는지 알 수 없습니다. 어떤 코드에 제곱 기능을 추가할까요?
```

AI가 이전 대화를 기억하지 못하기 때문에 "여기서"라는 맥락을 이해할 수 없습니다. 이 문제를 해결하기 위해 **대화 히스토리 관리**가 필요합니다.

---

## 2. LangChain 메시지 클래스

LangChain은 대화 히스토리를 관리하기 위한 3가지 메시지 타입을 제공합니다.

```python
from langchain_openai import AzureChatOpenAI
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from IPython.display import display, Markdown
```

| 메시지 타입 | 역할 | 설명 |
|---|---|---|
| `SystemMessage` | AI의 역할 정의 | 대화 전체에 걸쳐 AI의 행동 방식을 일관되게 유지 |
| `HumanMessage` | 사용자 메시지 | 사용자가 보내는 질문이나 요청 |
| `AIMessage` | AI 응답 | AI가 생성한 응답. 히스토리에 추가하여 맥락 유지 |

---

## 3. Azure OpenAI 클라이언트 설정

```python
# Azure OpenAI 연결 설정
azure_endpoint = "<YOUR_AZURE_ENDPOINT>"
api_key = "<YOUR_API_KEY>"
azure_deployment = "<YOUR_DEPLOYMENT_NAME>"

# 클라이언트 초기화
llm = AzureChatOpenAI(
    openai_api_version="2023-05-15",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.8,
    max_tokens=1000,
    top_p=0.8,
    request_timeout=60,
    max_retries=3
)
```

---

## 4. 대화 히스토리 구현

### 4.1 시스템 프롬프트 설정

AI의 역할, 성격, 행동 방식을 정의합니다.

```python
system_prompt = '''
당신은 Python 프로그래밍 전문가 AI 어시스턴트입니다.

[주요 역할]
- Python 코드 작성, 분석, 최적화, 디버깅 지원

[핵심 역량]
1. 코드 작성: 깔끔하고 효율적인 Python 코드 제공
2. 코드 분석: 기존 코드의 문제점 파악 및 개선안 제시
3. 문제 해결: 에러 메시지 분석 및 해결 방법 안내
4. 최적화: 성능 개선 및 리팩토링 제안

[응답 원칙]
- 명확성: 코드와 함께 상세한 설명 제공
- 완전성: 실행 가능한 완전한 코드 제공
- 교육적: 왜 그렇게 작성했는지 이유 설명
- 실용성: 실무에서 바로 사용 가능한 코드
- 안전성: 보안 취약점이 없는 코드
'''
```

### 4.2 메시지 리스트 초기화

대화 히스토리를 관리하기 위한 메시지 리스트를 초기화합니다.

```python
# 대화 히스토리 리스트
messages = []
```

---

## 5. 대화 히스토리 구조

### 5.1 첫 번째 대화

```python
# 1. 시스템 메시지 추가 (한 번만, 대화 전체에 적용)
messages.append(SystemMessage(content=system_prompt))

# 2. 사용자 질문 추가
user_input = "Python으로 4칙연산 코드 작성해줘"
messages.append(HumanMessage(content=user_input))

# 3. AI 호출
result = llm.invoke(messages)

# 4. AI 응답을 히스토리에 추가
messages.append(AIMessage(content=result.content))

# 5. 결과 출력
display(Markdown(result.content))
```

이 시점에서 `messages` 리스트의 구조:

```
[0] SystemMessage: Python 전문가 역할 정의
[1] HumanMessage: "4칙연산 코드 작성해줘"
[2] AIMessage: (4칙연산 코드 응답)
```

### 5.2 후속 대화 (컨텍스트 유지)

```python
# 후속 질문 - "여기서"라는 표현으로 이전 코드를 참조
user_input = "여기서 추가적으로 제곱 기능도 추가 가능해?"
messages.append(HumanMessage(content=user_input))

# AI 호출 - 전체 히스토리를 함께 전송
result = llm.invoke(messages)

# AI 응답을 히스토리에 추가
messages.append(AIMessage(content=result.content))

display(Markdown(result.content))
```

이 시점에서 `messages` 리스트의 구조:

```
[0] SystemMessage: Python 전문가 역할 정의
[1] HumanMessage: "4칙연산 코드 작성해줘"
[2] AIMessage: (4칙연산 코드 응답)
[3] HumanMessage: "여기서 제곱 기능도 추가 가능해?"
[4] AIMessage: (제곱 기능이 추가된 코드 응답)
```

> 💡 **핵심**: AI가 "여기서"라는 모호한 표현을 정확히 이해합니다. 이전에 작성한 4칙연산 코드를 기반으로 제곱 연산(`**`)을 추가하고, 기존 코드 구조를 유지하면서 새로운 기능만 확장합니다.

---

## 6. 대화 히스토리 확인

현재까지 누적된 모든 대화 내용을 확인할 수 있습니다.

```python
# 전체 히스토리 출력
for i, msg in enumerate(messages):
    msg_type = type(msg).__name__
    content_preview = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
    print(f"[{i}] {msg_type}: {content_preview}")
```

### 히스토리 구조 분석

- 각 메시지 객체의 타입과 내용을 확인할 수 있습니다
- `SystemMessage`, `HumanMessage`, `AIMessage`가 순서대로 저장됨
- 이 히스토리가 다음 대화에서 컨텍스트로 활용됨
- `llm.invoke(messages)` 호출 시 전체 리스트가 API로 전송됨

---

## 7. 메모리 관리 고려사항

대화가 길어질수록 토큰 사용량이 증가하므로 적절한 관리가 필요합니다.

### 토큰 제한

| 모델 | 최대 컨텍스트 길이 |
|---|---|
| GPT-3.5-turbo | 4,096 / 16,384 토큰 |
| GPT-4 | 8,192 / 32,768 토큰 |
| GPT-4-turbo | 128,000 토큰 |

### 관리 전략

```python
# 전략 1: 오래된 메시지 제거 (시스템 메시지는 유지)
MAX_HISTORY = 10
if len(messages) > MAX_HISTORY:
    # 시스템 메시지(첫 번째)는 항상 유지
    messages = [messages[0]] + messages[-(MAX_HISTORY-1):]

# 전략 2: 대화 요약
# 오래된 대화를 요약하여 하나의 SystemMessage로 압축
summary = "이전 대화 요약: 사용자가 4칙연산 코드를 요청했고, 제곱 기능을 추가함"
messages = [
    SystemMessage(content=system_prompt),
    SystemMessage(content=summary),
    # 최근 대화만 유지
]
```

### 비용 최적화 팁

- 불필요한 히스토리는 주기적으로 정리
- 시스템 프롬프트는 간결하게 유지
- `max_tokens`를 적절히 설정하여 응답 길이 제한
- 대화 세션별로 히스토리를 분리 관리

---

## 정리

- LLM은 기본적으로 **무상태(Stateless)**이므로 대화 히스토리를 직접 관리해야 함
- LangChain의 `SystemMessage`, `HumanMessage`, `AIMessage` 클래스로 대화 구조를 체계적으로 관리
- 매 호출 시 전체 메시지 리스트를 전송하여 AI가 이전 맥락을 이해하도록 함
- AI 응답을 반드시 히스토리에 추가해야 연속적인 대화가 가능
- 대화가 길어지면 토큰 제한과 비용을 고려하여 히스토리 관리 전략 필요
- 시스템 프롬프트에 역할, 역량, 응답 원칙을 명확히 정의하면 일관된 품질의 응답 확보 가능
