---
title: "Azure Terraform 표준 모듈 라이브러리 소개"
date: 2026-02-10
categories: [Terraform, Azure Terraform]
tags: [Terraform, Azure, IaC, 모듈, Infrastructure as Code, 자동화]
toc: true
toc_sticky: true
---

## 개요

Azure 인프라 프로비저닝을 위한 종합 Terraform 모듈 라이브러리를 소개합니다. 41개의 재사용 가능한 모듈, 레이어 기반 배포 아키텍처, 자동화 스크립트, 테스트 프레임워크를 제공합니다.

---

## 1. 프로젝트 구조

```
azure_modules/
├── modules/              # 41개의 재사용 가능한 Azure 모듈
│   ├── authorization/    # Identity, RBAC, Privileged Access
│   ├── network/          # VNet, Subnet, NSG, Firewall 등
│   ├── security/         # Key Vault, Firewall, NSG
│   ├── compute/          # VM, Scale Set
│   ├── container/        # ACR, AKS
│   ├── app_service/      # App Service, Function App
│   ├── database/         # MySQL, PostgreSQL, SQL, Redis, Cosmos DB
│   ├── storage/          # Storage Account, Blob, Queue 등
│   └── resource_group/   # Resource Group 관리
├── components/           # 레이어 기반 배포 템플릿
├── deploy/               # 배포 자동화 스크립트
└── tests/                # 테스트 프레임워크
```

---

## 2. 구현된 Azure 서비스 (41개 모듈)

### 인증 (Authorization)
- Azure User Assigned Identity
- Federated Identity Credential
- RBAC

### 네트워크 (Network)
- Virtual Network, Subnet, Route Table
- Load Balancer, Application Gateway, Traffic Manager
- Azure DNS / Private DNS, NAT Gateway
- Virtual Network Peering, Front Door, Private Endpoint

### 컴퓨팅 (Computing)
- Virtual Machine, Virtual Machine Scale Set, SSH Key 생성

### 컨테이너 (Container)
- Container Registry (ACR), Azure Kubernetes Service (AKS)

### App Service
- App Service (Linux/Windows), Azure Function (다양한 런타임)

### 보안 (Security)
- Network Security Group, Azure Firewall, Azure Key Vault

### 데이터베이스 (Database)
- MySQL Flexible Server, PostgreSQL Flexible Server
- Azure Cache for Redis, Azure SQL Server
- SQL Managed Instance, Azure Cosmos DB

### AI
- AI Foundry, AI Search

### 스토리지 (Storage)
- Storage Account, Container, Queue, Table, File Share

---

## 3. 3-Layer 배포 아키텍처

모든 배포는 3개 레이어로 구성됩니다:

```
00.governance → 01.network → 02.services
     ↓               ↓              ↓
  [RG, RBAC]   [VNet, NSG]    [App, DB]
```

### 레이어별 역할

| 레이어 | 역할 | 주요 리소스 |
|---|---|---|
| 00.governance | 거버넌스 | Resource Group, RBAC, Identity |
| 01.network | 네트워크 | VNet, Subnet, NSG, Route Table |
| 02.services | 서비스 | App Service, Database, Storage |

### State 파일 참조

레이어 간 데이터 전달은 `terraform_remote_state`를 사용합니다:

```hcl
data "terraform_remote_state" "governance" {
  backend = "local"
  config = {
    path = "../../../.terraform-states/governance.tfstate"
  }
}

resource_group_name = data.terraform_remote_state.governance.outputs.resource_group_name
```

---

## 4. 자동화 스크립트

`deploy/scripts/` 디렉토리에서 제공하는 자동화 도구:

| 스크립트 | 기능 |
|---|---|
| `deploy-all.sh` | 전체 레이어 순차 배포 |
| `destroy-all.sh` | 역순 삭제 (services → network → governance) |
| `validate-all.sh` | 모든 레이어 검증 (format + validate) |
| `plan-all.sh` | 모든 레이어 plan 실행 |
| `apply-layer.sh` | 특정 레이어만 배포 |

### 사용 예시

```bash
# 전체 배포
./deploy/scripts/deploy-all.sh components/scenarios/01.simple-web-app

# 개별 레이어 배포
./deploy/scripts/apply-layer.sh governance components/scenarios/01.simple-web-app

# 전체 삭제
./deploy/scripts/destroy-all.sh components/scenarios/01.simple-web-app
```

---

## 5. 빠른 시작

### 사전 요구사항

```bash
# Terraform 설치
brew install terraform

# Azure CLI 로그인
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### 시나리오 선택 및 배포

```bash
# 1. 시나리오 디렉토리로 이동
cd components/scenarios/01.simple-web-app

# 2. 각 레이어의 변수 파일 생성
cd 00.governance
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집

# 3. 자동 배포
cd deploy/scripts
./deploy-all.sh ../../components/scenarios/01.simple-web-app
```

---

## 6. 시나리오

### Simple Web App (구현 완료)

App Service + PostgreSQL Flexible Server 구성:

- **Governance**: Resource Group
- **Network**: VNet, Subnets, NSG
- **Services**: App Service (Node.js), PostgreSQL, Private DNS

### 추가 시나리오 (예정)

- AKS Microservices — AKS + ACR + Key Vault
- AI Workload — AI Foundry + Cognitive Services
- Data Platform — Cosmos DB + Synapse
- Enterprise Hub-Spoke — Hub-Spoke 네트워크

---

## 7. 보안 고려사항

### State 파일
- Git에 커밋 금지 (민감 정보 포함)
- `.gitignore`에 `*.tfstate` 패턴 포함
- 정기적 백업 권장

### terraform.tfvars
- Git에 커밋 금지 (자격 증명 포함)
- `terraform.tfvars.example` 파일로 필요 변수 문서화
- Key Vault 또는 환경 변수 사용 권장

### 네트워크 보안
- Private Endpoints 사용
- NSG 최소 권한 원칙
- VNet 통합 활성화

---

## 버전 히스토리

| 버전 | 주요 변경사항 |
|---|---|
| 2.0 | 레이어 기반 아키텍처, Components 템플릿, Deploy 자동화, Terratest |
| 1.5 | AI Foundry 모듈 추가, Key-Vault 개선 |
| 1.3 | Kubernetes 모듈 개선, App Service 개선 |
| 1.2 | Subnet/Route Table 개선, SQL Managed Instance 추가 |
| 1.0 | 초기 모듈 업로드 |
