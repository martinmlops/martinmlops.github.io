---
title: "Terraform 표준 가이드 - 핵심 원칙과 Best Practices"
date: 2026-02-05
categories: [Terraform, Compliance]
tags: [Terraform, Azure, IaC, Best Practices, State Management, CI/CD, 보안]
toc: true
toc_sticky: true
---

## 개요

Azure 인프라를 Terraform으로 관리할 때 준수해야 할 핵심 원칙, 네이밍 표준, State 관리, 보안 Best Practices를 정리한 종합 가이드입니다.

---

## 1. 핵심 원칙 (Core Principles)

| 원칙 | 설명 | 적용 방법 |
|---|---|---|
| 모듈화(Modularity) | 재사용 가능한 모듈 설계 | 기능별 모듈 분리 (networking, compute, database) |
| 환경 분리(Env Separation) | 개발/스테이징/프로덕션 격리 | 디렉토리 기반 분리 또는 Workspace 활용 |
| State 안전 관리 | Remote backend + Locking 필수 | Azure Storage Backend + Blob Lease |
| DRY 원칙 | 중복 최소화, 변수 활용 | locals, variables, 모듈 재사용 |

> Terraform 코드는 반드시 **버전 관리(Git)** 를 통해 관리하고, **PR 리뷰 프로세스**를 통해 변경사항을 검증합니다.

---

## 2. Provider 설정 및 인증

### 필수 Provider 구성

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
  backend "azurerm" {}
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}
```

### 인증 방법 비교

| 인증 방법 | 사용 시나리오 | 보안 수준 |
|---|---|---|
| Azure CLI | 로컬 개발 | 중 |
| Service Principal | CI/CD 파이프라인 | 상 |
| Managed Identity | Azure 호스팅 에이전트 | 상 |
| OIDC | GitHub Actions | 최상 (권장) |

> CI/CD에서는 **OIDC 인증**을 우선 고려하세요. Service Principal의 Client Secret 노출 위험을 원천 차단합니다.

---

## 3. 프로젝트 구조

### 소규모 (단일 환경)

```
deploy/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── terraform.tfvars    # .gitignore에 추가
└── backend.tf
```

### 중규모 (다중 환경)

```
├── deploy/
│   ├── dev/
│   ├── stg/
│   └── prod/
├── modules/
│   ├── networking/
│   ├── compute/
│   └── database/
└── README.md
```

### 대규모 (엔터프라이즈)

```
├── deploy/
│   ├── dev/ / stg/ / prod/
├── components/
│   ├── aks-cluster/
│   ├── hub-spoke-network/
│   └── sql-database/
├── modules/
│   ├── networking/ / compute/ / database/
├── scripts/
└── validate.sh
```

### 모듈 설계 기준

```
modules/aks-cluster/
├── main.tf          # 리소스 정의
├── variables.tf     # 입력 변수
├── outputs.tf       # 출력 값
├── versions.tf      # Provider 버전
├── locals.tf        # 로컬 값 (선택)
└── README.md
```

- 200줄 이상이면 파일 분리 고려 (`main.tf` → `network.tf`, `compute.tf`)
- 환경별 구성은 **디렉토리 분리 방식** 권장

---

## 4. 네이밍 표준

### 리소스 Logical Name

| 상황 | Logical Name | 예시 |
|---|---|---|
| 단일 리소스 | main, this | `azurerm_resource_group.main` |
| 역할 기반 | 역할명 | `azurerm_virtual_network.hub` |
| 복수 리소스 | 용도 | `azurerm_subnet.aks` |

### 변수 네이밍 규칙

- **snake_case** 사용 (camelCase 금지)
- Boolean: `is_`, `enable_` 접두사 (`is_production`, `enable_monitoring`)
- List/Map: 복수형 (`subnet_ids`, `allowed_ips`)
- 단위 포함: `retention_days`, `disk_size_gb`

### Azure 리소스 이름 생성 패턴

```hcl
locals {
  location_short = {
    koreacentral = "koce"
    koreasouth   = "koso"
  }
  loc = local.location_short[var.location]

  resource_names = {
    resource_group  = "001-${local.loc}-${var.environment}-${var.workload}-rg"
    virtual_network = "001-${local.loc}-${var.environment}-${var.workload}-vnet"
    aks_cluster     = "001-${local.loc}-${var.environment}-${var.workload}-aks"
    storage_account = "001${local.loc}${var.environment}${var.workload}st"
  }
}
```

### 피해야 할 패턴

| Bad | Good |
|---|---|
| `azurerm_resource_group.resource_group` | `azurerm_resource_group.main` |
| `variable "rg" {}` | `variable "resource_group_name" {}` |
| `azurerm_subnet.subnet1` | `azurerm_subnet.aks` |

---

## 5. State 관리

### Azure Storage Backend 설정

```bash
RESOURCE_GROUP="rg-terraform-state"
STORAGE_ACCOUNT="stterraformstate$(openssl rand -hex 4)"

# Storage Account 생성 (TLS 1.2, Public Access 차단)
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

# Versioning 활성화 (복구용)
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --enable-versioning true

# 삭제 방지 Lock
az lock create \
  --name "CanNotDelete" \
  --resource-group $RESOURCE_GROUP \
  --lock-type CanNotDelete
```

### State 분리 전략

대규모 프로젝트에서는 리소스 유형별로 State를 분리하여 **Blast Radius를 최소화**합니다.

```
tfstate/
├── networking/terraform.tfstate
├── aks/terraform.tfstate
├── database/terraform.tfstate
└── monitoring/terraform.tfstate
```

분리된 State 간 참조:

```hcl
data "terraform_remote_state" "networking" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformstate"
    container_name       = "tfstate"
    key                  = "networking/terraform.tfstate"
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  default_node_pool {
    vnet_subnet_id = data.terraform_remote_state.networking.outputs.aks_subnet_id
  }
}
```

### 주요 State 명령어

| 명령어 | 용도 |
|---|---|
| `terraform state list` | 리소스 목록 확인 |
| `terraform state show` | 상세 정보 확인 |
| `terraform state mv` | 이름 변경 / 모듈 이동 |
| `terraform state rm` | State에서 제거 (리소스 유지) |
| `terraform import` | 기존 리소스 가져오기 |

---

## 6. 변수 및 Locals 설계

### 변수 정의 Best Practice

```hcl
variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "koreacentral"
}

variable "node_pool_config" {
  description = "AKS node pool configuration"
  type = object({
    name       = string
    node_count = number
    vm_size    = string
    zones      = optional(list(string), ["1", "2", "3"])
  })
}
```

### Locals 활용 패턴

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  name_prefix   = "${var.project_name}-${var.environment}"
  is_production = var.environment == "prod"
  node_count    = local.is_production ? 3 : 1
}
```

---

## 7. CI/CD 파이프라인 통합

### GitHub Actions + OIDC (권장)

```yaml
name: Terraform CI/CD
env:
  ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  ARM_USE_OIDC: true

jobs:
  terraform:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - run: terraform init -backend-config=backend.hcl
      - run: terraform plan -out=tfplan
      - run: terraform apply tfplan
```

### 권장 파이프라인 흐름

1. `terraform fmt -check -recursive` — 코드 포맷팅 검증
2. `terraform validate` — 구문 유효성 검사
3. `tflint --recursive` — 정적 분석
4. `tfsec .` — 보안 검사
5. `terraform plan -out=tfplan` — 변경 계획 확인
6. PR Review & Approval — 코드 리뷰
7. `terraform apply tfplan` — 적용

---

## 8. 보안 Best Practices

### 민감 정보 관리

- `terraform.tfvars` 파일을 반드시 `.gitignore`에 추가
- State 파일에 민감 정보가 포함될 수 있음을 인지
- `sensitive = true` 설정으로 output 로그 노출 방지
- Azure Key Vault를 통한 비밀 관리 권장

### Lifecycle 보호

```hcl
resource "azurerm_resource_group" "main" {
  lifecycle {
    prevent_destroy = true    # 실수 삭제 방지
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,  # 외부 변경 무시
    ]
  }
}
```

### .gitignore 필수 항목

```
*.tfstate
*.tfstate.*
*.tfvars
*.tfvars.json
.terraform/
.terraform.lock.hcl
crash.log
tfplan
```

---

## 9. 코드 검증 도구

| 도구 | 용도 | 명령어 |
|---|---|---|
| terraform fmt | 코드 포맷팅 | `terraform fmt -recursive` |
| terraform validate | 구문 검증 | `terraform validate` |
| tflint | 정적 분석 | `tflint --recursive` |
| tfsec | 보안 스캔 | `tfsec .` |
| checkov | Policy as Code | `checkov -d .` |
| infracost | 비용 예측 | `infracost breakdown --path .` |

---

## 10. 실수 방지 체크리스트

### 코드 작성 시

- [ ] `terraform.tfvars`가 `.gitignore`에 추가되었는가?
- [ ] `prevent_destroy` lifecycle을 적절히 사용하고 있는가?
- [ ] 모든 변수에 `description`이 작성되었는가?
- [ ] output에 `sensitive` 설정이 적절한가?

### 배포 전

- [ ] `terraform fmt -check` 통과
- [ ] `terraform validate` 통과
- [ ] `terraform plan` 결과 리뷰 완료
- [ ] 보안 스캔(tfsec) 통과

### 배포 후

- [ ] 리소스 생성/변경 결과 확인
- [ ] State 파일 정상 저장 확인

---

## 참고 자료

- [Terraform 공식 문서](https://developer.hashicorp.com/terraform/docs)
- [Azure Provider 문서](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Naming Convention](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/azure-best-practices/naming-and-tagging)
- [Terraform Best Practices](https://www.terraform-best-practices.com)
- [tfsec](https://github.com/aquasecurity/tfsec)
- [tflint](https://github.com/terraform-linters/tflint)
