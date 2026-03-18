---
title: "클라우드 아이덴티티 및 접근 제어 전략"
date: 2026-01-15
categories: [Azure, 클라우드 아이덴티티]
tags: [Azure, Identity, Access Control, RBAC, ABAC, PIM, Directory Service, LDAP, Entra ID]
toc: true
toc_sticky: true
---

## 접근 제어 모델 개요

클라우드 환경에서 리소스에 대한 접근을 제어하는 것은 보안의 핵심입니다. 주요 접근 제어 모델을 살펴봅니다.

### DAC (Discretionary Access Control) - 임의적 접근 제어

- 리소스 소유자가 직접 접근 권한을 부여/회수
- 유연하지만 대규모 환경에서 관리가 어려움
- 파일 시스템의 소유자 기반 권한 설정이 대표적 예시

### MAC (Mandatory Access Control) - 강제적 접근 제어

- 시스템 관리자가 중앙에서 접근 정책을 설정
- 보안 레이블(분류 등급)에 기반한 접근 제어
- 군사/정부 기관에서 주로 사용
- 사용자가 임의로 권한을 변경할 수 없음

### RBAC (Role-Based Access Control) - 역할 기반 접근 제어

- 사용자에게 역할(Role)을 할당하고, 역할에 권한을 부여
- Azure의 기본 접근 제어 모델
- 구성 요소: 보안 주체(Security Principal), 역할 정의(Role Definition), 범위(Scope)
- 기본 제공 역할: Owner, Contributor, Reader, User Access Administrator

### ABAC (Attribute-Based Access Control) - 속성 기반 접근 제어

- 사용자, 리소스, 환경의 속성(Attribute)을 기반으로 접근 제어
- RBAC보다 세밀한 제어 가능
- 조건부 접근 정책 구현에 적합
- 예: "부서가 Finance이고, 근무시간 내이며, 관리 디바이스에서 접근하는 경우에만 허용"

## 접근 제어 모델 비교

| 모델 | 제어 주체 | 유연성 | 관리 복잡도 | 적합 환경 |
|------|-----------|--------|-------------|-----------|
| DAC | 리소스 소유자 | 높음 | 낮음 | 소규모 |
| MAC | 시스템 관리자 | 낮음 | 높음 | 군사/정부 |
| RBAC | 역할 기반 | 중간 | 중간 | 기업 환경 |
| ABAC | 속성 기반 | 매우 높음 | 높음 | 대규모/복합 |

## PIM (Privileged Identity Management) & JIT (Just-In-Time)

### PIM 개요

Azure AD PIM은 권한 있는 접근을 관리, 제어, 모니터링하는 서비스입니다.

- 시간 제한 접근: 영구 관리자 대신 적격(Eligible) 역할 할당
- 승인 기반 활성화: 역할 활성화 시 승인 워크플로 적용
- MFA 강제: 역할 활성화 시 다단계 인증 요구
- 감사 로그: 모든 권한 활성화/비활성화 기록

### JIT (Just-In-Time) 접근

- 필요한 시점에만 권한을 활성화
- 기본 상태에서는 최소 권한 유지
- 활성화 기간 만료 시 자동으로 권한 회수
- 공격 표면(Attack Surface) 최소화

## 디렉토리 서비스

### LDAP (Lightweight Directory Access Protocol)

- 디렉토리 서비스에 접근하기 위한 표준 프로토콜
- 트리 구조의 데이터 모델 (DN, OU, CN)
- 포트: 389 (LDAP), 636 (LDAPS)
- 인증 및 사용자/그룹 정보 조회에 사용

### Active Directory (AD DS)

- Microsoft의 온프레미스 디렉토리 서비스
- LDAP, Kerberos, NTLM 프로토콜 지원
- 도메인 컨트롤러(DC) 기반 인증
- 그룹 정책(GPO)을 통한 중앙 관리
- 포리스트(Forest) → 도메인(Domain) → OU 계층 구조

### Microsoft Entra ID (구 Azure AD)

- 클라우드 기반 ID 및 접근 관리 서비스
- REST API, OAuth 2.0, SAML, OpenID Connect 지원
- 조건부 접근(Conditional Access) 정책
- SSO(Single Sign-On) 지원
- B2B/B2C 시나리오 지원

## AD DS vs Entra ID 비교

| 특성 | Active Directory (AD DS) | Microsoft Entra ID |
|------|--------------------------|---------------------|
| 배포 위치 | 온프레미스 | 클라우드 |
| 프로토콜 | LDAP, Kerberos | REST API, OAuth, SAML |
| 인증 방식 | Kerberos 티켓 | 토큰 기반 (JWT) |
| 구조 | 포리스트/도메인/OU | 테넌트/디렉토리 |
| 디바이스 관리 | GPO | Intune/MDM |
| 확장성 | 수동 확장 | 자동 확장 |
| 관리 | 자체 관리 | Microsoft 관리형 |

## 하이브리드 아이덴티티

온프레미스 AD DS와 Entra ID를 연결하여 통합 ID 환경을 구축할 수 있습니다.

### Azure AD Connect

- 온프레미스 AD와 Entra ID 간 ID 동기화
- 동기화 방식: Password Hash Sync, Pass-through Auth, Federation (ADFS)
- 하이브리드 환경에서 SSO 구현의 핵심 구성 요소

### 권장 사항

1. 클라우드 우선 전략 채택 시 Entra ID를 기본 ID 공급자로 사용
2. 레거시 앱이 있는 경우 하이브리드 구성 고려
3. 조건부 접근 정책으로 Zero Trust 모델 구현
4. PIM을 활용한 최소 권한 원칙 적용

## 참고 자료

- [Azure RBAC 공식 문서](https://learn.microsoft.com/azure/role-based-access-control/)
- [Microsoft Entra ID 개요](https://learn.microsoft.com/entra/fundamentals/)
- [PIM 구성 가이드](https://learn.microsoft.com/entra/id-governance/privileged-identity-management/)
