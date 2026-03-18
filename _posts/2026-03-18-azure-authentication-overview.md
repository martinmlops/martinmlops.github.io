---
title: "Azure 인증 및 접근 제어 개요"
date: 2026-03-18 09:00:00 +0900
categories: [Azure, 인증 및 접근 제어]
tags: [azure, authentication, authorization, entra-id, rbac]
description: "Azure에서의 인증(AuthN)과 인가(AuthZ) 개념을 정리하고, Microsoft Entra ID 기반의 접근 제어 방식을 살펴봅니다."
image:
  path: /assets/images/azure/authentication-overview.png
  alt: "Azure 인증 및 접근 제어 아키텍처"
math: false
mermaid: false
pin: false
---

## 개요

클라우드 환경에서 **인증(Authentication)**과 **인가(Authorization)**는 보안의 핵심 축입니다. Azure에서는 Microsoft Entra ID(구 Azure Active Directory)를 중심으로 통합 ID 관리 및 접근 제어를 제공합니다.

이 포스트에서는 Azure의 인증/인가 체계를 정리하고, 실무에서 자주 사용하는 구성 패턴을 코드 예시와 함께 살펴봅니다.

## 인증(AuthN) vs 인가(AuthZ)

| 구분 | 인증 (Authentication) | 인가 (Authorization) |
|------|----------------------|---------------------|
| 목적 | 사용자가 누구인지 확인 | 사용자가 무엇을 할 수 있는지 결정 |
| 질문 | "당신은 누구입니까?" | "당신은 이 작업을 수행할 권한이 있습니까?" |
| 프로토콜 | OAuth 2.0, OpenID Connect, SAML | RBAC, ABAC, ACL |
| Azure 서비스 | Microsoft Entra ID | Azure RBAC |
| 시점 | 인가 이전에 수행 | 인증 이후에 수행 |

## Microsoft Entra ID 인증 흐름

Azure 리소스에 접근하기 위한 일반적인 인증 흐름은 다음과 같습니다.

### OAuth 2.0 Authorization Code Flow

```python
# Azure SDK를 사용한 인증 예시
from azure.identity import DefaultAzureCredential
from azure.mgmt.resource import ResourceManagementClient

# DefaultAzureCredential은 여러 인증 방법을 순차적으로 시도합니다
# 1. 환경 변수 → 2. Managed Identity → 3. Azure CLI → 4. VS Code
credential = DefaultAzureCredential()

# 인증된 자격 증명으로 리소스 관리 클라이언트 생성
resource_client = ResourceManagementClient(
    credential=credential,
    subscription_id="your-subscription-id"
)

# 리소스 그룹 목록 조회
for rg in resource_client.resource_groups.list():
    print(f"리소스 그룹: {rg.name}, 위치: {rg.location}")
```

### 서비스 프린시펄을 사용한 인증

자동화 시나리오에서는 서비스 프린시펄(Service Principal)을 사용합니다.

```bash
# Azure CLI로 서비스 프린시펄 생성
az ad sp create-for-rbac \
  --name "my-app-sp" \
  --role "Contributor" \
  --scopes "/subscriptions/{subscription-id}/resourceGroups/{rg-name}"
```

출력 결과:

```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "my-app-sp",
  "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

## Azure RBAC (역할 기반 접근 제어)

Azure RBAC는 Azure 리소스에 대한 세분화된 접근 관리를 제공합니다.

### 기본 제공 역할

```bash
# 구독 수준에서 역할 할당 조회
az role assignment list \
  --subscription "your-subscription-id" \
  --output table

# 특정 사용자에게 역할 할당
az role assignment create \
  --assignee "user@example.com" \
  --role "Reader" \
  --scope "/subscriptions/{subscription-id}"
```

### 커스텀 역할 정의

```json
{
  "Name": "Custom VM Operator",
  "Description": "VM 시작/중지/재시작만 허용하는 커스텀 역할",
  "Actions": [
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/restart/action",
    "Microsoft.Compute/virtualMachines/deallocate/action",
    "Microsoft.Compute/virtualMachines/read"
  ],
  "NotActions": [],
  "AssignableScopes": [
    "/subscriptions/{subscription-id}"
  ]
}
```

## 조건부 액세스 정책

조건부 액세스는 **신호(Signal)**를 기반으로 접근 결정을 내리는 정책 엔진입니다.

주요 신호:
- 사용자 또는 그룹 멤버십
- IP 위치 정보
- 디바이스 상태
- 애플리케이션
- 실시간 위험 감지

> **참고:** 조건부 액세스 정책은 1차 인증이 완료된 후에 적용됩니다. DDoS 공격에 대한 1차 방어선으로 사용되지 않습니다.
{: .prompt-info }

## 모범 사례

1. **최소 권한 원칙** 적용 — 필요한 최소한의 권한만 부여
2. **Managed Identity** 우선 사용 — 자격 증명 관리 부담 제거
3. **조건부 액세스** 정책 활용 — 컨텍스트 기반 접근 제어
4. **정기적인 접근 검토** 수행 — 불필요한 권한 회수
5. **PIM(Privileged Identity Management)** 활용 — 특권 접근의 JIT(Just-In-Time) 관리

## 참고 자료

- [Microsoft Entra ID 공식 문서](https://learn.microsoft.com/ko-kr/entra/identity/)
- [Azure RBAC 공식 문서](https://learn.microsoft.com/ko-kr/azure/role-based-access-control/)
- [조건부 액세스 개요](https://learn.microsoft.com/ko-kr/entra/identity/conditional-access/)
