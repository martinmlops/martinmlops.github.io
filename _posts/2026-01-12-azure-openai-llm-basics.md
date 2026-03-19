---
title: "Azure OpenAI 기초 - LLM 호출과 파라미터 이해"
date: 2026-01-12
categories: [AI, LLM]
tags: [Azure OpenAI, LangChain, Temperature, Top-P, GPT]
toc: true
toc_sticky: true
---

## 개요

Azure OpenAI 서비스를 활용하여 LLM(Large Language Model)을 호출하고, 핵심 파라미터인 Temperature와 Top-P를 이해하는 실습 가이드입니다. LangChain 프레임워크를 사용하여 Azure OpenAI와 연동하는 방법을 다룹니다.

---

## 1. 환경 설정

### 1.1 필수 패키지 설치

Azure OpenAI와 LangChain을 사용하기 위한 필수 라이브러리를 설치합니다.

```bash
pip install -qU openai langchain-openai
```

### 1.2 라이브러리 Import

- `AzureChatOpenAI`: Azure OpenAI 서비스와 연결하기 위한 LangChain 클래스
- `display, Markdown`: Jupyter 노트북에서 마크다운 형식으로 결과를 예쁘게 출력하기 위한 함수

```python
from langchain_openai import AzureChatOpenAI
from IPython.display import display, Markdown
```

### 1.3 Azure OpenAI 연결 설정

```python
# Azure OpenAI 사용을 위한 파라미터
azure_endpoint = "<YOUR_AZURE_ENDPOINT>"
api_key = "<YOUR_API_KEY>"

# OpenAI 모델
azure_deployment = "<YOUR_DEPLOYMENT_NAME>"
```

> ⚠️ **보안 주의**: API 키와 엔드포인트는 환경변수나 Azure Key Vault를 통해 관리하세요. 코드에 직접 하드코딩하지 마세요.

---

## 2. LLM 파라미터 설정

AI 모델의 응답 특성을 조절하는 핵심 파라미터들입니다.

```python
# LLM 파라미터 설정
temperature = 0.8   # 응답의 창의성/랜덤성 조절 (0~1)
top_p = 0.8         # 토큰 선택 범위 조절 (0~1)
max_tokens = 1000   # 생성할 최대 토큰 수
```

| 파라미터 | 설명 | 범위 |
|---|---|---|
| `temperature` | 응답의 창의성과 랜덤성 조절. 0에 가까울수록 일관되고 예측 가능, 1에 가까울수록 창의적이고 다양 | 0 ~ 1 |
| `top_p` | 토큰 선택 범위 조절 (nucleus sampling). 낮을수록 일관성, 높을수록 다양한 표현 | 0 ~ 1 |
| `max_tokens` | 생성할 최대 토큰 수. 응답 길이를 제한 | 모델별 상이 |

---

## 3. Azure OpenAI 클라이언트 초기화

설정한 파라미터들을 사용하여 Azure OpenAI 클라이언트를 생성합니다.

```python
llm = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=temperature,
    max_tokens=max_tokens,
    top_p=top_p,
    request_timeout=60,   # API 요청 타임아웃 (초)
    max_retries=3          # 실패 시 재시도 횟수
)
```

### 초기화 파라미터 상세

- `openai_api_version`: 사용할 OpenAI API 버전
- `request_timeout`: API 요청 타임아웃 (초). 네트워크 지연 등을 고려하여 적절히 설정
- `max_retries`: 실패 시 재시도 횟수. 일시적 오류에 대한 복원력 확보

---

## 4. 기본 LLM 호출

### 4.1 시스템 프롬프트와 사용자 프롬프트

시스템 프롬프트는 AI의 역할과 행동 방식을 정의하고, 사용자 프롬프트는 실제 질문을 담습니다.

```python
system_prompt = '''
너는 유아들을 가르치는 친절한 유치원 교사야.
아이들에게 바다의 아름다움과 신기한 생물들에 대해 쉽고 재미있게 설명해줘.
주의: 무섭거나 위험한 내용은 절대 언급하지 말고 밝고 긍정적인 이야기만 해줘.
'''

user_prompt = '바다에 대해 설명해줘'
```

### 4.2 메시지 구조 생성 및 호출

LangChain에서 사용하는 메시지 형식으로 변환하여 호출합니다.

```python
# 메시지 구조: (역할, 내용) 튜플 형태
messages = [
    ("system", system_prompt),   # AI의 역할 정의
    ("user", user_prompt)        # 사용자의 실제 질문
]

# AI 모델 호출
result = llm.invoke(messages)

# 결과 출력 (마크다운 형식)
display(Markdown(result.content))
```

> 💡 `("system", ...)` 메시지는 대화 전체에 걸쳐 AI의 행동을 일관되게 유지하는 역할을 합니다. 시스템 프롬프트에 역할, 톤, 제약 조건 등을 명확히 정의하면 원하는 품질의 응답을 얻을 수 있습니다.

---

## 5. Temperature 파라미터 심화

Temperature는 AI의 **창의성과 예측 가능성**을 조절하는 핵심 파라미터입니다.

### 5.1 Temperature 값별 특성

| Temperature 범위 | 특성 | 적합한 용도 |
|---|---|---|
| 0.0 ~ 0.3 | 매우 일관되고 예측 가능한 답변 | 사실적 정보, 번역, 요약 |
| 0.4 ~ 0.7 | 균형잡힌 답변 | 일반적인 대화, 설명 |
| 0.8 ~ 1.0 | 창의적이고 다양한 답변 | 창작, 브레인스토밍 |

### 5.2 실습: Temperature 비교

같은 프롬프트로 Temperature 값을 변경하여 응답 차이를 비교합니다.

```python
user_prompt = '''
다음 단어들을 사용해서 짧은 이야기를 만들어주세요:
- 로봇
- 꽃
- 우주선
- 마법

이야기는 3-4문장으로 작성해주세요.
'''

messages = [("user", user_prompt)]
```

**Temperature = 0.8 (높은 창의성)**

```python
llm_creative = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.8,
    max_tokens=1000,
    top_p=0.8
)
result = llm_creative.invoke(messages)
```

> 결과 예시: 고장 난 로봇 한 대가 폐허가 된 행성에서 마지막으로 남은 한 송이 꽃을 발견했다. 그 순간 하늘에서 우주선이 내려오며 꽃에서 퍼져 나온 빛이 로봇을 감싸더니, 녹슨 몸이 반짝이는 새 몸으로 변했다.

**Temperature = 0.1 (높은 일관성)**

```python
llm_consistent = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.1,
    max_tokens=1000,
    top_p=0.8
)
result = llm_consistent.invoke(messages)
```

> 결과 예시: 고장 난 로봇 한 대가 버려진 우주선 안에서 홀로 깨어났습니다. 로봇은 창밖을 보다가, 공기 한 점 없는 우주 공간에 홀로 떠 있는 빛나는 꽃 한 송이를 발견했습니다.

> 💡 Temperature가 낮을수록 일관되고 예측 가능한 응답, 높을수록 창의적이고 다양한 응답이 생성됩니다. 같은 프롬프트를 여러 번 실행해도 낮은 Temperature에서는 거의 동일한 결과가 나옵니다.

---

## 6. Top-P 파라미터 심화

Top-P(Nucleus Sampling)는 AI가 다음 단어를 선택할 때 **고려할 후보의 범위**를 조절합니다.

### 6.1 Top-P 값별 특성

| Top-P 값 | 고려 범위 | 특성 |
|---|---|---|
| 0.1 | 가장 확률 높은 10%의 단어만 고려 | 안전하고 예측 가능한 선택 |
| 0.5 | 상위 50%의 단어 고려 | 적당한 다양성 |
| 0.8~0.9 | 상위 80-90%의 단어 고려 | 높은 다양성과 창의성 |

### 6.2 실습: Top-P 비교

노을 표현이라는 창의적 작업으로 Top-P 효과를 비교합니다.

```python
user_prompt = '노을의 색깔을 창의적으로 표현해줘.'
messages = [("user", user_prompt)]
```

**Top-P = 0.8 (높은 다양성)**

```python
llm_diverse = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.8,
    max_tokens=1000,
    top_p=0.8
)
result = llm_diverse.invoke(messages)
```

> 결과 예시: 해가 하루를 다 쓰고 남긴 분홍 영수증 / 주황빛 설탕을 바다에 쏟아 부어 만든 하늘

**Top-P = 0.1 (높은 일관성)**

```python
llm_focused = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.8,
    max_tokens=1000,
    top_p=0.1
)
result = llm_focused.invoke(messages)
```

> 결과 예시: 노을은 하루가 입는 마지막 옷감 같아. 해가 지는 동안, 하늘은 주황빛 실과 분홍빛 실을 섞어 천천히 짜 내려가는 거대한 스카프 같지.

> 💡 Top-P가 낮으면 가장 확률이 높은 소수의 단어만 선택하므로 표현이 안정적이고, 높으면 더 다양한 어휘를 활용하여 창의적인 표현이 가능합니다.

---

## 7. Temperature + Top-P 조합 실습

두 파라미터를 함께 조절하면 더 정교한 제어가 가능합니다.

### 7.1 실험 설계

외계인의 피자 반응이라는 창의적 주제로 4가지 조합을 테스트합니다.

```python
user_prompt = '외계인이 지구에 와서 처음 먹어본 피자에 대한 반응을 묘사해줘.'
messages = [("user", user_prompt)]
```

### 7.2 조합별 결과 비교

| 조합 | Temperature | Top-P | 특성 | 결과 경향 |
|---|---|---|---|---|
| 보수적 | 0.2 | 0.1 | 안전하고 일관된 답변 | 정형화된 묘사, 예측 가능 |
| 균형 | 0.7 | 0.8 | 창의적이면서 통제된 답변 | 적절한 창의성과 구조 |
| 창의적 | 1.0 | 0.9 | 매우 독창적이고 예측 불가능 | 파격적 표현, 높은 변동성 |
| 특수 | 0.1 | 0.9 | 낮은 창의성 + 높은 어휘 다양성 | 안정적 구조에 다양한 어휘 |

```python
# 보수적 조합 (T=0.2, P=0.1)
llm_conservative = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.2, max_tokens=1000, top_p=0.1
)

# 균형 조합 (T=0.7, P=0.8)
llm_balanced = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.7, max_tokens=1000, top_p=0.8
)

# 창의적 조합 (T=1.0, P=0.9)
llm_creative_max = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=1.0, max_tokens=1000, top_p=0.9
)

# 특수 조합 (T=0.1, P=0.9)
llm_special = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
    azure_deployment=azure_deployment,
    azure_endpoint=azure_endpoint,
    api_key=api_key,
    temperature=0.1, max_tokens=1000, top_p=0.9
)
```

### 7.3 실무 권장 조합

| 용도 | Temperature | Top-P | 이유 |
|---|---|---|---|
| 코드 생성 | 0.1~0.3 | 0.1~0.3 | 정확성과 일관성이 중요 |
| 기술 문서 작성 | 0.3~0.5 | 0.5~0.7 | 정확하면서도 자연스러운 표현 |
| 일반 대화 | 0.7 | 0.8 | 자연스럽고 다양한 응답 |
| 창작/브레인스토밍 | 0.8~1.0 | 0.8~0.9 | 최대한 창의적인 아이디어 |

> ⚠️ **주의**: Temperature와 Top-P를 동시에 극단적으로 설정하면(예: T=1.0, P=1.0) 응답 품질이 불안정해질 수 있습니다. 일반적으로 하나를 고정하고 다른 하나를 조절하는 것이 권장됩니다.

---

## 정리

- Azure OpenAI는 LangChain의 `AzureChatOpenAI` 클래스를 통해 쉽게 연동 가능
- **시스템 프롬프트**로 AI의 역할, 톤, 제약 조건을 정의하여 일관된 응답 품질 확보
- **Temperature**: 응답의 창의성/랜덤성 조절 (0~1). 낮을수록 일관적, 높을수록 창의적
- **Top-P**: 토큰 선택 범위 조절 (0~1). 낮을수록 안전한 선택, 높을수록 다양한 어휘
- 두 파라미터를 조합하여 용도에 맞는 최적의 응답 품질을 달성할 수 있음
- API 키 등 민감 정보는 반드시 환경변수 또는 Azure Key Vault로 관리
- `request_timeout`과 `max_retries` 설정으로 네트워크 오류에 대한 복원력 확보
