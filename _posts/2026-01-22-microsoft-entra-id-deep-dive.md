---
title: "Microsoft Entra ID & Domain Services 완벽 가이드"
date: 2026-01-22
categories: [Azure, Microsoft Entra ID]
tags: [Microsoft Entra ID, Azure AD, Entra Domain Services, SSO, MFA, 조건부 액세스, Zero Trust, Trust Fabric]
toc: true
toc_sticky: true
---

## 개요

Microsoft Entra는 과거의 Azure AD가 'Azure 리소스에 대한 인증'에 집중했던 것에서 확장되어, AWS, GCP를 포함한 멀티 클라우드 환경과 온프레미스, SaaS를 모두 연결하는 "Identity-first Security" 플랫폼입니다. 솔루션 아키텍트 관점에서는 이를 '보안 연결의 허브'로 이해하면 좋습니다.

---

## 1. Microsoft Entra 서비스 개요

### 1.1 정의와 목적

- **정의**: Microsoft의 모든 ID 및 네트워크 액세스 솔루션을 통합한 제품군
- **목적**: 모든 사용자(직원, 파트너, 고객)가 모든 리소스(앱, 데이터, 기기)에 안전하게 액세스할 수 있도록 지원
- **보안 철학**: Zero Trust(제로 트러스트) 모델 기반 — "절대 신뢰하지 말고 항상 검증하라"

### 1.2 제품군 통합 비교

#### ID 및 액세스 관리 (Identity & Access Management)

| 제품명 | 핵심 기능 | 대상 및 용도 |
|---|---|---|
| Microsoft Entra ID | 클라우드 ID 관리, SSO, MFA, 조건부 액세스 | 모든 조직 구성원 (구 Azure AD) |
| Entra ID Governance | ID 수명 주기 관리, 액세스 검토, 권한 자동화 | 규정 준수 및 보안 감사가 필요한 조직 |
| Entra External ID | 외부 고객 및 파트너 ID 관리 (B2C/B2B) | 외부 협업자 및 고객 서비스 앱 |
| Entra Domain Services | 관리형 도메인 컨트롤러 (LDAP, Kerberos) | 레거시 인증이 필요한 클라우드 내 VM |

#### 신규 네트워크 액세스 (SSE)

| 제품명 | 핵심 기능 | 대상 및 용도 |
|---|---|---|
| Entra Private Access | 제로 트러스트 네트워크 액세스 (ZTNA) | VPN 없이 내부 프라이빗 리소스 연결 |
| Entra Internet Access | 보안 웹 게이트웨이 (SWG) | 안전한 인터넷 액세스 및 SaaS 보호 |

#### 특수 신원 및 권한 보호

| 제품명 | 핵심 기능 | 대상 및 용도 |
|---|---|---|
| Entra ID Protection | 위험 기반 자동 탐지 및 수정 정책 적용 | 고도화된 계정 탈취 공격 방어 |
| Entra Workload ID | 비사람(앱, 서비스, 봇) ID 관리 | 애플리케이션 간 인증 및 API 보안 |
| Entra Verified ID | 분산 ID(DID) 기반 자격 증명 | 디지털 증명서 발급 및 검증 |
| Entra Permissions Management | 멀티클라우드(AWS, GCP, Azure) 권한 관리 | CIEM 솔루션, 과도한 권한 회수 |

---

## 2. Microsoft Entra 4가지 단계

Microsoft Entra는 조직의 보안 성숙도에 따라 4가지 핵심 영역을 커버합니다.

### A. 제로 트러스트 액세스 제어 설정 (Core Identity)

가장 기본이 되는 ID 관리 및 레거시 앱 지원 단계입니다.

- **Microsoft Entra ID**: 플래그십 제품. 필수 ID 관리, 인증, 정책 및 보호를 제공하는 클라우드 기반 IDaaS
  - 모든 테넌트는 `contoso.onmicrosoft.com` 형태의 초기 도메인을 가지며, 커스텀 도메인 추가 가능
  - Microsoft 365, Azure, Dynamics 사용자는 이미 이 서비스를 사용 중
- **Microsoft Entra Domain Services**: 그룹 정책(GPO), LDAP, Kerberos/NTLM 인증 등 관리형 도메인 서비스 제공
  - 클라우드 네이티브 인증을 지원하지 않는 레거시 애플리케이션을 클라우드 VM에서 실행해야 할 때 필수

### B. 직원에 대한 보안 액세스 (Internal Security)

내부 구성원의 업무 환경을 보호하는 단계입니다.

- **Entra Private Access (ZTNA)**: VPN 없이 프라이빗 앱 및 리소스에 안전하게 연결
  - 예시: 재택근무자가 사내 네트워크에 연결된 프린터를 VPN 없이 안전하게 사용
- **Entra Internet Access (SWG)**: 모든 인터넷 리소스, SaaS 앱, Microsoft 365 앱에 대한 액세스 보안
- **Entra ID Governance**: ID 수명 주기 관리(입사/퇴사 시 권한 자동 회수), 액세스 요청 및 검토 자동화
- **Entra ID Protection**: ID 기반 위험 감지 및 보고. 위험 수준에 따라 MFA를 강제하는 등 조건부 액세스 정책과 연동
- **Entra Verified ID**: 분산 ID(DID) 표준 기반의 디지털 자격 증명 발급 서비스
  - 예시: 졸업생이 대학으로부터 디지털 학위증을 발급받아 기업에 증명 자료로 제출

### C. 고객 및 파트너를 위한 보안 액세스 (External ID)

외부 협업 및 소비자 서비스(B2C/B2B) 보안 단계입니다.

- **Entra External ID**: 파트너와 게스트 협업 및 소비자 지향 앱(CIAM) 관리
  - Google, Facebook 같은 소셜 계정이나 이메일 일회용 암호(OTP)를 이용한 셀프 서비스 등록 지원

### D. 모든 클라우드에서 액세스 보호 (Multi-Cloud & Workload)

사람이 아닌 대상과 타 클라우드 환경까지 보호하는 단계입니다.

- **Entra Workload ID**: 애플리케이션, 서비스, 컨테이너 등 '비사람' ID 보안
  - 예시: GitHub Actions가 Azure 리소스에 접근할 때 사용하는 워크로드 ID 보안 및 적응형 정책 적용
- **Entra Permissions Management (CIEM)**: Azure뿐만 아니라 AWS, GCP 전체 환경의 권한 가시화 및 관리

---

## 3. 트러스트 패브릭 (Trust Fabric)

트러스트 패브릭은 "사용자, 기기, 애플리케이션, 데이터"라는 4가지 엔드포인트를 위치에 상관없이(On-prem, Multi-cloud, Edge) 하나의 보안 경계로 묶어주는 지능형 보안 망을 의미합니다.

### 3.1 왜 '패브릭(Fabric)'인가?

기존의 보안은 '성벽(Perimeter)' 모델이었습니다. 하지만 클라우드 시대에는 성벽이 무너졌습니다.

- **유연성**: 조직의 규모나 환경에 관계없이 필요한 곳에 보안을 덧댈 수 있음
- **연결성**: ID 관리(Entra ID), 네트워크 접근(SSE), 권한 관리(CIEM)가 별개가 아닌 하나의 유기체처럼 작동
- **강인함**: 한 곳이 뚫려도 다른 격자가 즉시 위험을 감지하고 차단하는 '제로 트러스트'의 실체화

### 3.2 트러스트 패브릭의 3대 핵심 기둥

#### ① 신원 확인의 중앙화 (Unified Identity)

모든 접근의 시작은 '누구인가'입니다. Entra ID를 중심으로 사람뿐만 아니라 워크로드(앱, 봇) 및 기기에 대한 신원을 단일 플랫폼에서 검증합니다.

#### ② 조건부 액세스의 지능화 (Conditional Access)

단순한 ID/PW 확인이 아니라, 접속하는 순간의 컨텍스트(Context)를 분석합니다.

> 예: "평소 한국에서 접속하던 사용자가 5분 뒤 우크라이나 IP로 접속 시도 시 즉시 차단" (위험 기반 신호 처리)

#### ③ 접근 경로의 가시화 및 제어 (Secure Access)

- **Private Access**: 내부 서버 접근 시 VPN 대신 Identity 기반의 터널을 형성
- **Internet Access**: 외부 인터넷 사이트 이용 시 보안 정책 강제
- **Permissions Management**: 과도하게 부여된 권한을 회수하여 공격 표면(Attack Surface) 최소화

### 3.3 실무적 가치 (Business Impact)

| 관점 | 효과 |
|---|---|
| 사용자 | 한 번의 로그인(SSO)으로 모든 클라우드와 사내 시스템을 안전하게 이용 |
| 관리자 | AWS, GCP, Azure의 권한 관리를 Entra 콘솔 하나에서 처리하여 설정 오류 방지 |
| 보안 | 공격자가 내부망에 침투하더라도 '패브릭'의 각 격자(Policy)에 걸려 수평 이동(Lateral Movement)이 원천 봉쇄 |

---

## 4. Microsoft Entra ID 상세 분석

### 4.1 AD DS vs Entra ID — 본질적 차이

> "Entra ID는 클라우드에 떠 있는 도메인 컨트롤러(DC)인가?" → **아니오**

AD DS가 '서버와 PC의 중앙 통제'에 중점을 둔다면, Entra ID는 '웹 기반 앱과 사용자 신원에 대한 지능형 게이트웨이' 역할을 합니다.

#### 서비스 모델의 차이

- **AD DS**: Windows Server VM에서 실행되는 IaaS/Self-managed 서비스. 고객이 인프라를 직접 관리
- **Entra ID**: 관리형 디렉터리 서비스인 PaaS. 인프라 유지 관리 및 배포 리소스가 필요 없으나, 하위 수준의 시스템 제어권은 줄어듦

#### 주요 기능의 확장

AD DS에서는 기본적으로 제공되지 않는 클라우드 특화 보안 기능을 포함합니다.

- **MFA(다단계 인증)**: 추가 보안 계층 제공
- **ID 보호 (ID Protection)**: 비정상 로그인 활동 식별 및 대응
- **SSO(Single Sign-On)**: 수만 개의 SaaS 앱에 대한 단일 로그인 지원
- **셀프 서비스**: 암호 재설정(SSPR) 등을 사용자가 직접 수행

### 4.2 테넌트 (Multi-Tenancy)

- **정의**: 개별 Microsoft Entra 인스턴스를 의미하며, 조직/회사 단위의 보안 경계이자 컨테이너
- **규모**: 세계 최대의 다중 테넌트 디렉터리로, 매주 10억 건 이상의 인증을 처리
- **도메인**: 기본적으로 `[prefix].onmicrosoft.com` 형태의 DNS를 가지며, 소유한 커스텀 도메인을 추가 가능

#### 구독(Subscription)과의 관계

- **1:N 관계**: 하나의 테넌트는 여러 개의 Azure 구독을 관리할 수 있음. 동일한 사용자/그룹으로 여러 구독의 리소스를 제어
- **N:1 제약**: 하나의 Azure 구독은 반드시 하나의 테넌트에만 연결되어야 함 (RBAC 권한 부여의 기준점)

### 4.3 스키마 및 개체 모델의 특징

#### AD DS 스키마와의 차이점

- **개체 형식 단순화**: AD DS보다 적은 수의 개체 형식
- **컴퓨터 vs 디바이스**: '컴퓨터 클래스' 정의가 없으며, 대신 '디바이스 클래스'가 존재. 조인(Join) 프로세스 자체가 완전히 다름
- **GPO(그룹 정책) 부재**: 기존의 그룹 정책 개체를 사용할 수 없음. 대신 '최신 관리(Modern Management)' 개념(Intune 등)을 따름
- **OU(조직 구성 단위) 부재**: 계층 구조의 OU가 없음. 대신 그룹 멤버 자격을 통해 개체를 정렬하고 관리

#### 애플리케이션 개체 (Application & Service Principal)

클라우드 앱 인증을 위해 두 가지 클래스를 구분하여 관리합니다.

- **Application 클래스**: 애플리케이션의 글로벌 정의 (설계도)
- **ServicePrincipal 클래스**: 특정 테넌트 내에서의 실제 인스턴스 (실체)

> 이 분리 덕분에 하나의 앱 정의를 여러 테넌트에서 재사용(멀티 테넌트 앱)할 수 있습니다.

### 4.4 핵심 비교: AD DS vs Microsoft Entra ID

| 구분 항목 | AD DS | Microsoft Entra ID |
|---|---|---|
| 통신 프로토콜 | LDAP, Kerberos, NTLM, DNS | HTTP, HTTPS (REST API, Microsoft Graph) |
| 인증 방식 | 티켓 기반 (Kerberos) | 토큰 기반 (SAML, OIDC, OAuth 2.0) |
| 계층 구조 | 계층적 (Forest → Domain → OU) | 평면적 (Flat — User, Group, Unit) |
| 제어 도구 | 그룹 정책 (GPO) | 조건부 액세스 (Conditional Access), Intune |
| 장치 관리 | Domain Join (컴퓨터 개체) | Entra Registered / Joined (모바일 포함) |
| 관리 책임 | 인프라 관리 필요 (VM, 패치, 백업) | MS가 가용성 및 업데이트 관리 (SaaS) |

#### 프로토콜의 차이가 만드는 접근성

- **AD DS**: 내부망(Intranet) 활용. 방화벽 밖에서 AD 인증을 받으려면 VPN이 필수
- **Entra ID**: 인터넷 기반 프로토콜을 사용하므로, 어디서든 별도의 통로 없이 안전한 인증이 가능

#### GPO에서 Intune으로의 전환

많은 관리자가 "Entra ID에는 GPO가 없어서 불편하다"고 말합니다. 하지만 GPO의 복잡한 상속 구조보다, Intune(MDM/MAM)을 통한 정책 배포와 Entra ID의 조건부 액세스를 결합하는 것이 유연하고 강력한 보안을 제공합니다.

> ⚠️ Azure VM에 AD DS를 올릴 때는 Host Caching을 'None'으로 설정한 별도의 데이터 디스크가 필수입니다. 이는 AD 데이터베이스(NTDS.dit)의 무결성을 보장하기 위함입니다.

---

## 5. Microsoft Entra Domain Services 상세 분석

### 5.1 왜 Entra DS가 필요한가?

Entra ID가 "Modern 웹 서비스"를 위한 것이라면, Entra DS는 "Legacy App"들을 위한 서비스입니다. VM에 직접 DC를 설치하는 수고와 비용을 줄여주는 "관리형 도메인 서비스(Managed Service)"라는 점이 핵심입니다.

조직이 기존 LOB(Line of Business) 앱을 Azure로 이전할 때 직면하는 문제들:

- **인증 호환성**: 앱이 Kerberos, NTLM, LDAP 인증을 요구함
- **Site-to-Site VPN만 연결**: 인증 트래픽이 매번 온프레미스로 이동하여 지연 시간 발생
- **Azure VM에 DC 직접 배포**: 복제 트래픽 관리, OS 패치, 모니터링 등 운영 부담 및 비용 증가

### 5.2 Entra DS란?

Microsoft가 직접 관리하는 관리형 도메인 서비스입니다.

- **제공 기능**: 도메인 가입(Domain Join), 그룹 정책(GPO), LDAP 리딩, Kerberos/NTLM 인증
- **포함 사항**: Microsoft Entra ID P1 또는 P2 계층의 일부로 실행 가능
- **통합**: Entra Connect와 연동 시 온프레미스 AD의 자격 증명을 그대로 클라우드에서 사용 가능 (클라우드 전용 구성도 가능)

### 5.3 주요 이점

- **운영 오버헤드 제거**: DC 관리, 업데이트, 모니터링을 Microsoft가 전담
- **복제 관리 불필요**: 복잡한 AD 복제본 배포 및 관리 작업이 사라짐
- **간소화된 권한**: '도메인 관리자'나 '엔터프라이즈 관리자' 그룹을 직접 관리할 필요 없음

### 5.4 반드시 알아야 할 제한 사항

| 항목 | 상세 내용 |
|---|---|
| 스키마 확장 | 불가능. 특정 앱이 AD 스케마 수정을 요구한다면 Entra DS를 쓸 수 없음 |
| OU 구조 | 수평적 구조. 중첩된 OU(Nested OU)를 지원하지 않음 |
| 신뢰 관계 | 타 도메인과의 포리스트 트러스트(Forest Trust) 형성에 제약이 있음 |
| GPO 필터링 | WMI 필터나 보안 그룹 필터링을 사용할 수 없음 |
| 관리 권한 | 도메인 전체에 대한 'Full Admin' 권한은 부여되지 않음 (AAD DC Administrators 그룹 사용) |

### 5.5 실무 적용 예시

- **Lift-and-Shift**: SQL Server, SharePoint 등 기존 서버 앱을 Azure VM으로 그대로 옮길 때
- **클라우드 네이티브 환경의 레거시 지원**: 최신 클라우드 앱과 함께 돌아가는 오래된 인증 방식의 내부 도구 보호
- **LDAP 서버 대체**: 클라우드 내 앱들을 위한 관리형 LDAP 서버가 필요할 때

### 5.6 비용 및 구성

- **과금 모델**: 디렉터리 내 개체 수(크기)에 따라 시간당 요금 청구
- **구성 방식**: Azure Portal에서 활성화하며, 특정 가상 네트워크(VNet)에 배치

---

## 6. 라이선스 체계

| 계층 | 설명 |
|---|---|
| Free | Azure/M365 구독 시 기본 포함. 기본적인 ID 관리 기능 제공 |
| P1 | 조건부 액세스, 하이브리드 ID 등 고급 기능 |
| P2 | ID Protection, PIM(권한 관리) 등 최고 수준의 보안 기능 |
| 독립 실행형 | External ID, Workload ID, Governance 등은 별도 또는 Suite 형태로 제공 |

> 💡 Microsoft 365나 EMS(Enterprise Mobility + Security) 구독에 포함되는 경우가 많으므로 기존 구독을 먼저 확인하세요.

---

## 7. 관리 및 개발 도구

- **Microsoft Entra 관리 센터**: 모든 제품을 구성하고 관리하는 웹 포털
- **Microsoft Graph API**: 사용자 수명 주기 관리 및 라이선스 배포 등 관리 작업 자동화
- **Microsoft ID 플랫폼**: 개발자가 표준 프로토콜(OIDC, OAuth2 등)을 사용하여 앱에 인증 환경을 빌드할 수 있는 오픈소스 라이브러리 및 서비스 제공

---

## 정리

| 서비스 | 용도 | 프로토콜 |
|---|---|---|
| Entra ID | 클라우드 네이티브 앱용 | SAML, OAuth2, OIDC |
| Entra DS | 클라우드 내 레거시 앱용 | Managed Kerberos/LDAP |
| VM 위 AD DS | 특수한 설정(스키마 확장 등)이 꼭 필요한 레거시용 | Full AD DS |

> 💡 레거시 시스템이 Kerberos 인증을 요구한다면 AD DS나 Entra DS를 유지해야 하지만, 신규 서비스나 SaaS 연동이 목적이라면 Entra ID를 중심으로 설계하세요.
