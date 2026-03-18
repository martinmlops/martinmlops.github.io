---
title: "Microsoft Entra ID & Entra Domain Service 심층 분석"
date: 2026-01-22
categories: [Azure, Microsoft Entra ID]
tags: [Azure, Entra ID, Azure AD, Domain Service, Trust Fabric, Identity, SSO]
toc: true
toc_sticky: true
---

## Microsoft Entra 서비스 개요

Microsoft Entra는 ID 및 접근 관리를 위한 통합 제품군입니다. 기존 Azure Active Directory에서 확장된 포괄적인 ID 솔루션을 제공합니다.

### Entra 제품 라인업

| 제품 | 설명 |
|------|------|
| Microsoft Entra ID | 클라우드 기반 ID 및 접근 관리 (구 Azure AD) |
| Entra ID Governance | ID 수명주기 관리, 접근 검토, 권한 관리 |
| Entra ID Protection | 위험 기반 조건부 접근, ID 보호 |
| Entra Verified ID | 분산 ID, 검증 가능한 자격 증명 |
| Entra Permissions Management | 멀티 클라우드 권한 관리 (CIEM) |
| Entra Workload ID | 앱/서비스의 ID 관리 |
| Entra Internet Access | 인터넷 트래픽 보안 (SSE) |
| Entra Private Access | 프라이빗 앱 접근 (ZTNA) |

### Entra ID 4단계 발전

1. **기본 ID 관리**: 사용자/그룹 관리, 기본 인증
2. **SSO 및 앱 통합**: 수천 개의 SaaS 앱과 SSO 연동
3. **조건부 접근**: 위치, 디바이스, 위험 수준 기반 정책
4. **Zero Trust 구현**: ID 중심의 보안 모델, 지속적 검증

## Trust Fabric 개념

Trust Fabric은 Microsoft의 ID 중심 보안 아키텍처 개념입니다.

### 핵심 원칙

- **ID가 새로운 보안 경계**: 네트워크 경계 대신 ID를 기반으로 신뢰 결정
- **지속적 검증**: 모든 접근 요청에 대해 실시간 검증
- **최소 권한**: 필요한 최소한의 권한만 부여
- **위반 가정**: 항상 침해가 발생했다고 가정하고 설계

### Trust Fabric 구성 요소

```
사용자/디바이스 → 조건부 접근 정책 평가 → 리소스 접근
                    ↓
            [신호 수집]
            - 사용자 위치
            - 디바이스 상태
            - 앱 민감도
            - 실시간 위험
            - 세션 컨텍스트
                    ↓
            [정책 결정]
            - 허용 / 차단
            - MFA 요구
            - 디바이스 준수 요구
            - 세션 제한
```

### 조건부 접근 정책 구성

| 신호 | 설명 | 예시 |
|------|------|------|
| 사용자/그룹 | 대상 사용자 지정 | 관리자 그룹, 외부 사용자 |
| 위치 | IP 기반 위치 | 신뢰할 수 있는 위치, 국가 |
| 디바이스 | 디바이스 상태 | 준수 디바이스, 도메인 가입 |
| 앱 | 대상 애플리케이션 | Office 365, 사용자 지정 앱 |
| 위험 수준 | 실시간 위험 평가 | 로그인 위험, 사용자 위험 |

## Entra ID vs AD DS 상세 비교

### 인증 프로토콜

| 프로토콜 | AD DS | Entra ID |
|----------|-------|----------|
| Kerberos | ✅ 기본 | ❌ |
| NTLM | ✅ 레거시 | ❌ |
| LDAP | ✅ 기본 | ❌ (Entra DS에서 지원) |
| SAML 2.0 | ❌ (ADFS 필요) | ✅ 기본 |
| OAuth 2.0 | ❌ | ✅ 기본 |
| OpenID Connect | ❌ | ✅ 기본 |
| WS-Federation | ✅ (ADFS) | ✅ |

### 관리 모델

| 항목 | AD DS | Entra ID |
|------|-------|----------|
| 관리 단위 | 도메인/OU/GPO | 테넌트/관리 단위 |
| 정책 적용 | 그룹 정책 (GPO) | 조건부 접근 정책 |
| 디바이스 관리 | 도메인 가입 + GPO | Entra 가입 + Intune |
| 앱 관리 | 수동 배포 | 앱 등록/엔터프라이즈 앱 |
| 확장 | 도메인 컨트롤러 추가 | 자동 (Microsoft 관리) |

## Microsoft Entra Domain Services

Entra Domain Services는 클라우드에서 관리형 도메인 서비스를 제공합니다. 도메인 컨트롤러를 직접 관리할 필요 없이 LDAP, Kerberos, NTLM 인증을 사용할 수 있습니다.

### 주요 특징

- 관리형 도메인: Microsoft가 도메인 컨트롤러를 관리
- LDAP/Kerberos/NTLM 지원: 레거시 앱 호환성
- Entra ID와 자동 동기화: 사용자/그룹 정보 동기화
- 그룹 정책 지원: 제한적 GPO 기능

### 사용 사례

1. **레거시 앱 마이그레이션**: LDAP/Kerberos가 필요한 앱을 클라우드로 이전
2. **리프트 앤 시프트**: 온프레미스 VM을 Azure로 이전 시 도메인 가입 유지
3. **하이브리드 환경 간소화**: 온프레미스 DC 없이 도메인 서비스 사용

### Entra ID vs Entra Domain Services

| 기능 | Entra ID | Entra Domain Services |
|------|----------|----------------------|
| LDAP | ❌ | ✅ |
| Kerberos | ❌ | ✅ |
| NTLM | ❌ | ✅ |
| 도메인 가입 | Entra 가입 | 전통적 도메인 가입 |
| GPO | ❌ | ✅ (제한적) |
| OU 관리 | 관리 단위 | OU 구조 |
| 용도 | 최신 앱/SaaS | 레거시 앱 호환 |

### 아키텍처

```
온프레미스 AD DS ←→ Azure AD Connect ←→ Entra ID ←→ Entra Domain Services
                                              ↓                    ↓
                                        최신 앱 (OAuth)     레거시 앱 (LDAP/Kerberos)
                                        SaaS 앱 (SAML)      도메인 가입 VM
```

## 마이그레이션 전략

### 단계별 접근

1. **평가**: 현재 AD DS 환경 분석, 앱 호환성 확인
2. **하이브리드 구성**: Azure AD Connect로 동기화 설정
3. **앱 현대화**: SAML/OAuth 지원 앱으로 전환
4. **레거시 지원**: Entra Domain Services로 레거시 앱 지원
5. **클라우드 전환**: 온프레미스 DC 점진적 폐기

### 권장 사항

- 새로운 앱은 Entra ID 네이티브로 개발
- 조건부 접근 정책을 활용한 Zero Trust 구현
- PIM으로 관리자 권한 최소화
- 정기적인 접근 검토(Access Review) 수행

## 참고 자료

- [Microsoft Entra ID 문서](https://learn.microsoft.com/entra/identity/)
- [Entra Domain Services 개요](https://learn.microsoft.com/entra/identity/domain-services/)
- [조건부 접근 정책 가이드](https://learn.microsoft.com/entra/identity/conditional-access/)
- [Zero Trust 아키텍처](https://learn.microsoft.com/security/zero-trust/)
