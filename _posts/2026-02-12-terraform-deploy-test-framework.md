---
title: "Terraform 3-Layer 배포 아키텍처와 테스트 프레임워크"
date: 2026-02-12
categories: [Terraform, Azure Terraform]
tags: [Terraform, Terratest, Go, 배포 자동화, 테스트, CI/CD, Azure]
toc: true
toc_sticky: true
---

## 개요

Terraform 3-Layer 배포 아키텍처의 상세 구조와 Terratest 기반 테스트 프레임워크를 다룹니다. 자동화 스크립트를 통한 배포/삭제/검증 방법과 단위/통합 테스트 작성법을 실습합니다.

---

## 1. 3-Layer 배포 구조

### 레이어별 파일 구성

```
00.governance/
├── backend.tf          # Local backend 설정
├── provider.tf         # Azure provider
├── main.tf             # Resource Group, RBAC
├── variables.tf / outputs.tf / locals.tf / data.tf
└── terraform.tfvars

01.network/
├── backend.tf / provider.tf
├── data.tf             # governance state 참조
├── main.tf             # VNet, Subnet, NSG
└── ...

02.services/
├── backend.tf / provider.tf
├── data.tf             # governance + network state 참조
├── main.tf             # App Service, Database
└── ...
```

### State 파일 관리

```
.terraform-states/
├── governance.tfstate
├── network.tfstate
└── services.tfstate
```

레이어 간 참조는 `terraform_remote_state` 데이터 소스를 사용:

```hcl
# 01.network/data.tf
data "terraform_remote_state" "governance" {
  backend = "local"
  config = {
    path = "../../../.terraform-states/governance.tfstate"
  }
}

resource_group_name = data.terraform_remote_state.governance.outputs.resource_group_name
```

---

## 2. 배포 자동화 스크립트

### 전체 배포

```bash
./deploy/scripts/deploy-all.sh ../../components/scenarios/01.simple-web-app
```

실행 순서: Governance → Network → Services

### 전체 삭제 (역순)

```bash
./deploy/scripts/destroy-all.sh ../../components/scenarios/01.simple-web-app
```

실행 순서: Services → Network → Governance

### 사전 검증

```bash
./deploy/scripts/validate-all.sh ../../components/scenarios/01.simple-web-app
```

### 변경사항 미리보기

```bash
./deploy/scripts/plan-all.sh ../../components/scenarios/01.simple-web-app
```

### 개별 레이어 배포

```bash
./deploy/scripts/apply-layer.sh governance ../../components/scenarios/01.simple-web-app
./deploy/scripts/apply-layer.sh network ../../components/scenarios/01.simple-web-app
./deploy/scripts/apply-layer.sh services ../../components/scenarios/01.simple-web-app
```

---

## 3. 테스트 프레임워크

### 테스트 레벨

| 레벨 | 도구 | 실행 시간 | Azure 리소스 |
|---|---|---|---|
| Unit Test | terraform validate | 1-2분 | 생성 안 함 |
| Integration Test | Terratest (Go) | 30-60분 | 실제 생성 |
| Pre-deploy Check | format + validate | 1분 | 생성 안 함 |

---

### Unit Test (단위 테스트)

모듈의 구문 및 기본 유효성 검증:

```bash
cd tests/unit
./run-unit-tests.sh
```

수행 작업:
1. 모든 모듈 디렉토리 검색
2. `terraform init -backend=false` 실행
3. `terraform validate` 실행
4. 통과/실패 결과 리포트

---

### Integration Test (통합 테스트)

Terratest를 사용한 실제 인프라 배포 및 검증:

```bash
cd tests/integration
go mod download
go test -v -timeout 60m
```

#### Terratest 기본 구조

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestMyModule(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../../path/to/module",
        Vars: map[string]interface{}{
            "variable_name": "value",
        },
        NoColor: true,
    })

    // 테스트 종료 시 자동 정리
    defer terraform.Destroy(t, terraformOptions)

    // 배포
    terraform.InitAndApply(t, terraformOptions)

    // 검증
    output := terraform.Output(t, terraformOptions, "output_name")
    assert.NotEmpty(t, output)
}
```

#### 테스트 파일

- `governance_test.go` — 거버넌스 레이어 테스트
- `full_stack_test.go` — 전체 스택 (3개 레이어) 테스트

---

### Pre-deployment Check

```bash
./tests/scripts/pre-deploy-check.sh ../../components/scenarios/01.simple-web-app
```

수행 작업:
1. Terraform 포맷 검사
2. Terraform 설정 유효성 검증

---

## 4. 테스트 모범 사례

### 병렬 실행

```go
func TestModule(t *testing.T) {
    t.Parallel()  // 여러 테스트를 동시에 실행
}
```

### 정리 작업 (Cleanup)

항상 `defer terraform.Destroy()`를 사용:

```go
defer terraform.Destroy(t, terraformOptions)
```

### 고유한 리소스 이름

리소스 충돌 방지:

```go
uniqueID := fmt.Sprintf("test-%d", time.Now().Unix())
rgName := fmt.Sprintf("rg-%s", uniqueID)
```

### 환경 변수 사용

```bash
export TF_VAR_subscription_id="<YOUR_SUBSCRIPTION_ID>"
export TF_VAR_tenant_id="<YOUR_TENANT_ID>"
go test -v -timeout 60m
```

---

## 5. CI/CD 통합

### GitHub Actions 예제

```yaml
name: Terraform Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - name: Configure Azure Credentials
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Run Pre-deployment Checks
        run: ./tests/scripts/pre-deploy-check.sh .
      - name: Run Unit Tests
        run: cd tests/unit && ./run-unit-tests.sh
      - name: Run Integration Tests
        run: cd tests/integration && go test -v -timeout 60m
```

---

## 6. 비용 관리

통합 테스트는 실제 Azure 리소스를 생성하므로:

1. 테스트 후 즉시 정리 — `defer terraform.Destroy()` 사용
2. 저렴한 SKU 사용 — 테스트용 최소 사양
3. 단기 실행 — 필요한 검증만 수행
4. 실패 시 수동 정리 — `az group delete --name rg-test-* --yes`

---

## 트러블슈팅

| 문제 | 해결 방법 |
|---|---|
| State Lock 오류 | `terraform force-unlock <lock-id>` |
| 모듈 초기화 오류 | `rm -rf .terraform && terraform init` |
| Go 모듈 오류 | `go clean -modcache && go mod download` |
| 테스트 타임아웃 | `go test -v -timeout 120m` |
