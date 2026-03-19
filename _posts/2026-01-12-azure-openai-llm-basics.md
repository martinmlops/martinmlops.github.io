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

### 필수 패키지 설치

```bash
pip install -qU openai langchain-openai
```

### 라이브러리 Import

```python
from langchain_openai import AzureChatOpenAI
from IPython.display import display, Markdown
```

### Azure OpenAI 연결 설정

```python
# Azure OpenAI 사용을 위한 파라미터
azure_endpoint = "<YOUR_AZURE_ENDPOINT>"
api_key = "<YOUR_API_KEY>"

# OpenAI 모델
azure_deployment = "<YOUR_DEPLOYMENT_NAME>"
```

> ⚠️ **보안 주의**: API 키와 엔드포인트는 환경변수나 Azure Key Vault를 통해 관리하세요. 코드에 직접 하드코딩하지 마세요.

---

## 2. 기본 LLM 호출

### 클라이언트 초기화

```python
llm = AzureChatOpenAI(
    openai_api_version="2024-12-01-preview",
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

### 시스템 프롬프트와 사용자 프롬프트

```python
system_prompt = '''
너는 유아들을 가르치는 친절한 유치원 교사야.
아이들에게 바다의 아름다움과 신기한 생물들에 대해 쉽고 재미있게 설명해줘.
'''

user_prompt = '바다에 대해 설명해줘'

messages = [
    ("system", system_prompt),
    ("user", user_prompt)
]

result = llm.invoke(messages)
display(Markdown(result.content))
```

---

## 3. Temperature 파라미터

Temperature는 AI의 **창의성과 예측 가능성**을 조절하는 핵심 파라미터입니다.

| Temperature 범위 | 특성 | 적합한 용도 |
|---|---|---|
| 0.0 ~ 0.3 | 매우 일관되고 예측 가능 | 사실적 정보, 번역, 요약 |
| 0.4 ~ 0.7 | 균형잡힌 답변 | 일반적인 대화, 설명 |
| 0.8 ~ 1.0 | 창의적이고 다양한 답변 | 창작, 브레인스토밍 |

### 실습: Temperature 비교

같은 프롬프트로 Temperature 값을 변경하여 응답 차이를 비교합니다.

```python
user_prompt = '''
다음 단어들을 사용해서 짧은 이야기를 만들어주세요:
- 로봇, 꽃, 우주선, 마법
이야기는 3-4문장으로 작성해주세요.
'''
```

**Temperature 0.8 결과**: 고장 난 로봇 한 대가 폐허가 된 행성에서 마지막으로 남은 한 송이 꽃을 발견했다. 그 순간 하늘에서 우주선이 내려오며 꽃에서 퍼져 나온 빛이 로봇을 감싸더니, 녹슨 몸이 반짝이는 새 몸으로 변했다.

**Temperature 0.1 결과**: 고장 난 로봇 한 대가 버려진 우주선 안에서 홀로 깨어났습니다. 로봇은 창밖을 보다가, 공기 한 점 없는 우주 공간에 홀로 떠 있는 빛나는 꽃 한 송이를 발견했습니다.

> 💡 Temperature가 낮을수록 일관되고 예측 가능한 응답, 높을수록 창의적이고 다양한 응답이 생성됩니다.

---

## 4. Top-P 파라미터

Top-P는 AI가 다음 단어를 선택할 때 **고려할 후보의 범위**를 조절합니다.

| Top-P 값 | 특성 |
|---|---|
| 0.1 | 가장 확률 높은 10%의 단어만 고려 → 안전하고 예측 가능 |
| 0.5 | 상위 50%의 단어 고려 → 적당한 다양성 |
| 0.8~0.9 | 상위 80-90%의 단어 고려 → 높은 다양성과 창의성 |

### 실습: Top-P 비교

```python
user_prompt = '노을의 색깔을 창의적으로 표현해줘.'
```

**Top-P 0.8**: 해가 하루를 다 쓰고 남긴 분홍 영수증 / 주황빛 설탕을 바다에 쏟아 부어 만든 하늘

**Top-P 0.1**: 노을은 하루가 입는 마지막 옷감 같아. 해가 지는 동안, 하늘은 주황빛 실과 분홍빛 실을 섞어 천천히 짜 내려가는 거대한 스카프 같지.

---

## 5. Temperature + Top-P 조합

두 파라미터를 함께 조절하면 더 정교한 제어가 가능합니다.

| 조합 | Temperature | Top-P | 특성 |
|---|---|---|---|
| 보수적 | 0.2 | 0.1 | 안전하고 일관된 답변 |
| 균형 | 0.7 | 0.8 | 창의적이면서 통제된 답변 |
| 창의적 | 1.0 | 0.9 | 매우 독창적이고 예측 불가능 |
| 특수 | 0.1 | 0.9 | 낮은 창의성 + 높은 어휘 다양성 |

---

## 정리

- Azure OpenAI는 LangChain의 `AzureChatOpenAI` 클래스를 통해 쉽게 연동 가능
- **Temperature**: 응답의 창의성/랜덤성 조절 (0~1)
- **Top-P**: 토큰 선택 범위 조절 (0~1)
- 두 파라미터를 조합하여 용도에 맞는 최적의 응답 품질을 달성할 수 있음
- API 키 등 민감 정보는 반드시 환경변수 또는 Key Vault로 관리
