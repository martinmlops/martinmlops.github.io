---
title: "인증(AuthN)과 인가(AuthZ) 및 Microsoft Entra 아키텍처 가이드"
date: 2026-01-08 09:00:00 +0900
categories:
  - Azure
  - 인증 및 접근 제어
tags:
  - azure
  - authentication
  - authorization
  - entra-id
  - oauth
  - oidc
  - saml
  - kerberos
  - ldap
  - radius
  - ssh
excerpt: "Microsoft Entra ID를 기반으로 하는 다양한 인증 프로토콜(OAuth, OIDC, SAML, LDAP, RADIUS, Kerberos 등)과 보안 전략을 상세히 다룹니다."
---

> 본 문서는 클라우드 솔루션 아키텍트의 관점에서 Microsoft Entra ID(구 Azure AD)를 기반으로 하는 다양한 인증 프로토콜과 보안 전략을 상세히 다룹니다.
{: .notice--info}

## 1. 인증(Authentication)과 인가(Authorization)의 이해

![인증과 인가 개요](/assets/images/azure/authn-authz/image.png)

**인증 (AuthN):** "당신은 누구입니까?"에 대한 검증입니다. 사용자가 주장하는 신원이 실제와 일치하는지 확인합니다. (예: 생체 인식, MFA, 패스워드)

**인가 (AuthZ):** "당신은 무엇을 할 수 있습니까?"에 대한 결정입니다. 인증된 사용자가 특정 자원(API, 파일, 서버)에 접근할 권한이 있는지 확인합니다.

> 보안 사고의 상당수는 인증이 아닌 **과도한 권한 부여(Over-privileged)** 즉, 인가 관리 실패에서 발생합니다. 항상 **최소 권한 원칙(Least Privilege)**을 적용해야 합니다.
{: .notice--warning}

### 1.1 인증 프로토콜과 Microsoft Entra 통합

Microsoft Entra ID는 하이브리드 클라우드 환경의 아이덴티티 허브입니다.
온프레미스의 AD와 클라우드의 Entra ID를 동기화하여 사용자가 한 번의 로그인으로 온프레미스 자원과 SaaS(Office 365, Salesforce 등)에 모두 접근할 수 있는 SSO(Single Sign-On) 환경을 구축합니다.

## 2. 헤더 기반 인증 (Header-based)

애플리케이션이 직접 인증을 처리하지 않고, 앞단의 프록시가 주입해주는 HTTP 헤더 정보를 신뢰하는 방식입니다.

![헤더 기반 인증](/assets/images/azure/authn-authz/image-1.png)

### 작동 방식

- **작동 원리:** `Microsoft Entra Application Proxy`가 사용자를 먼저 인증한 후, 내부 앱으로 요청을 보낼 때 `HTTP Header`에 사용자 ID를 삽입합니다.
- **용도:** 소스 코드 수정이 불가능한 레거시 웹 앱을 클라우드로 노출할 때 사용합니다.

## 3. LDAP 인증 (Lightweight Directory Access Protocol)

디렉터리 서비스에 접근하기 위한 표준 프로토콜로, 주로 사내 인프라 관리용으로 쓰입니다.

- **L (Lightweight):** 예전의 복잡했던 표준(X.500)을 가볍게 다듬었다는 뜻.
- **D (Directory):** 데이터를 저장하는 방식이 일반적인 DB와 달리 '디렉터리(계층 구조)' 방식.
- **A (Access):** 그 정보에 접근하거나 수정하기 위한,
- **P (Protocol):** 약속된 통신 규약.

![LDAP 인증](/assets/images/azure/authn-authz/image-2.png)

### 작동 방식

작동 원리: 서버나 장비가 `Bind(로그인)` 요청을 통해 디렉터리에 저장된 사용자 정보를 확인합니다.

- **사용자 요청:** 사용자가 LDAP 기반 앱에 로그인을 시도합니다.
- **LDAP Bind 요청:** 애플리케이션(LDAP 클라이언트)이 **Entra DS**의 인스턴스로 `LDAP Bind` 요청(ID/PW 전달)을 보냅니다.
- **자격 증명 확인:** Entra DS는 관리형 도메인 내에 복제된 사용자 정보를 바탕으로 자격 증명을 대조합니다.
- **인증 결과 반환:** 정보가 일치하면 `Bind Success`를 앱에 반환하고, 앱은 사용자에게 액세스를 허용합니다.

> 여기서 중요한 점은 사용자가 Entra ID에서 비밀번호를 변경하면, 이 변경 사항이 **Entra ID → Entra DS** 방향으로 자동으로 동기화된다는 것입니다. 즉, 사용자는 클라우드와 레거시 앱에서 동일한 비밀번호를 사용할 수 있습니다.
{: .notice--info}

**Entra 통합:** `Microsoft Entra Domain Services(DS)`를 통해 클라우드에서도 레거시 LDAP 앱을 지원할 수 있습니다. 보안을 위해 반드시 LDAPS(636 포트)를 권장합니다. 기본적으로 Microsoft Entra ID(PaaS)는 HTTP 기반의 모던 프로토콜(OIDC, OAuth, SAML)을 사용하며, LDAP 프로토콜을 직접적으로 이해하지 못합니다. 따라서 레거시 앱이 Entra ID의 사용자 정보를 LDAP 방식으로 사용하기 위해서는 Microsoft Entra Domain Services (Entra DS)라는 관리형 서비스가 필요합니다.

## 4. OAuth 2.0 (Open Authorization)

- OAuth 2.0(Open Authorization)은 내 비밀번호를 직접 알려주지 않고도, 제3의 앱이 내 자원(데이터)에 접근할 수 있도록 '권한을 위임'해 주는 업계 표준 프로토콜입니다.
- **핵심:** 인증(Authentication)보다는 인가(Authorization)에 집중합니다.
- **비유:** 호텔 프런트(인증 서버)에서 내 신원을 확인하고 카드키(Access Token)를 줍니다. 이 카드키로 방 문(리소스)을 열 수 있습니다. 이때 카드키는 방 문만 열 수 있지, 호텔의 모든 권한을 가진 것은 아닙니다.

![OAuth 2.0](/assets/images/azure/authn-authz/image-3.png)

### 작동 방식

작동 원리: 사용자의 비밀번호 대신 Access Token을 사용하여 API에 접근합니다.
핵심 개념: `Authorization Code Grant` 흐름이 보안상 가장 권장되며, 토큰의 유효 기간(TTL) 관리가 중요합니다.

- **승인 요청:** 클라이언트 앱이 사용자에게 "나 네 정보 좀 써도 돼?"라고 물어봅니다.
- **인증 및 동의:** 사용자는 **Microsoft Entra ID**에 로그인하고, 앱이 요청한 권한(Scope)에 동의합니다.
- **인가 코드 발급:** Entra ID는 앱에게 "사용자가 허락했어"라는 일종의 영수증인 '인가 코드(Auth Code)'를 줍니다.
- **토큰 교환:** 앱은 이 코드를 Entra ID에 다시 보내서, 실제 열쇠인 액세스 토큰(Access Token)으로 바꿉니다.
- **리소스 접근:** 앱은 이제 이 토큰을 들고 **자원 서버**로 가서 데이터를 가져옵니다.

## 5. OIDC 인증 (OpenID Connect) (OAuth 2.0 + 인증)

$$OIDC = OAuth\ 2.0 + ID\ Token\ (Identity\ Information)$$

- **OAuth 2.0:** "이 키로 문 열어도 돼(인가)"에 집중.
- **OIDC:** OAuth 2.0 위에 "이 키를 가진 사람은 누구야(인증)"라는 신분증 기능을 한 겹 더 씌운 것.

OAuth 2.0의 결과물이 '액세스 토큰(열쇠)'이라면, OIDC의 결과물은 ID 토큰(신분증)입니다.

- **포맷:** 주로 **JWT(JSON Web Token)** 형식을 사용합니다. 텍스트 형태라 사람이 읽을 수 있고, 디지털 서명이 되어 있어 위조가 불가능합니다.
- **내용 (Claims):** 토큰 안에는 다음과 같은 정보들이 담깁니다.
    - `sub` (Subject): 사용자를 식별하는 고유 ID
    - `iss` (Issuer): 토큰을 발행한 곳 (예: Microsoft Entra ID)
    - `aud` (Audience): 이 토큰을 받을 앱 이름
    - `email`, `name`: 사용자의 실제 정보

![OIDC 인증](/assets/images/azure/authn-authz/image-4.png)

### 작동 방식

작동 원리: OAuth의 기능을 활용하면서도 사용자의 프로필 정보가 담긴 ID Token(JWT 형식)을 추가로 제공합니다.

- **로그인 요청:** 사용자가 앱에서 "Microsoft 계정으로 로그인"을 클릭합니다.
- **인증 및 동의:** 브라우저가 Entra ID 로그인 페이지로 이동합니다. 사용자는 로그인하고 MFA(2단계 인증) 등을 통과합니다.
- **인증 코드 전달:** Entra ID가 사용자 브라우저를 통해 앱으로 '인증 코드'를 보냅니다.
- **토큰 교환:** 앱은 이 코드를 들고 뒷단(Back-channel)에서 Entra ID에게 가서 말합니다. "이 코드 줄 테니까 진짜 신분증(ID Token)이랑 열쇠(Access Token) 줘!"
- **신원 확인:** 앱은 받은 **ID Token**의 서명을 확인하고, "아, 이 사람은 홍길동이 맞구나!"라고 확신하며 로그인을 시켜줍니다.

## 6. 암호 기반 SSO (Password-based SSO)

현대적 프로토콜을 지원하지 않는 구형 앱을 위한 "ID/PW 자동 입력" 방식입니다.

**암호 기반 SSO**는 현대적인 인증 프로토콜(SAML, OIDC 등)을 전혀 지원하지 않고, 오직 **아이디와 비밀번호 입력창**만 있는 구형 웹 애플리케이션을 위해 설계된 방식입니다.

- **핵심 원리:** 사용자가 일일이 비밀번호를 입력하는 대신, **Microsoft Entra ID가 사용자의 비밀번호를 금고(Vault)에 안전하게 보관**하고 있다가, 로그인 화면이 나오면 브라우저가 대신 입력(Replay)해 주는 방식입니다.
- **비유:** 자주 가는 사이트의 아이디와 비번을 수첩에 적어두었다가, 로그인할 때마다 비서가 대신 타이핑해 주는 것과 같습니다.

![암호 기반 SSO](/assets/images/azure/authn-authz/image-5.png)

### 작동 방식

이 방식은 현대적인 프로토콜처럼 '토큰'을 주고받는 것이 아니라, **화면상의 폼(Form)을 채우는 방식**으로 작동합니다.

1. **자격 증명 저장:** 관리자나 사용자가 해당 앱의 아이디와 비밀번호를 Entra ID에 저장합니다. (암호화되어 안전하게 보관됩니다.)
2. **로그인 시도:** 사용자가 My Apps 포털에서 해당 앱 아이콘을 클릭합니다.
3. **Entra ID 인증:** 먼저 Entra ID가 사용자를 인증합니다. 이때 MFA(2단계 인증)나 **조건부 액세스**를 걸 수 있어, 구형 앱임에도 보안 수준이 올라갑니다.
4. **자동 입력 (Form-filling):** 브라우저 확장 프로그램(Microsoft Apps Extension)이 앱의 로그인 페이지를 감지하고, 저장된 아이디와 비번을 로그인 폼에 자동으로 넣어줍니다.

> 보안 수준이 상대적으로 낮으므로, 가능한 경우 SAML이나 OIDC로의 전환을 권고합니다.
{: .notice--warning}

## 7. RADIUS 인증 (Remote Authentication Dial-In User Service)

**RADIUS**는 네트워크 접근 제어를 위한 **AAA(Authentication, Authorization, Accounting)** 프로토콜입니다.

- **비유:** 건물 입구의 '보안 게이트'와 같습니다. 사원증(ID/PW)을 찍으면, 게이트가 네오텍 DB(RADIUS 서버)에 물어보고 문을 열어줄지 결정하며, 언제 들어왔는지 기록까지 남기는 시스템입니다.
- **주 사용처:** VPN 장비, 사내 Wi-Fi(WPA2-Enterprise), 네트워크 스위치 등 하드웨어 중심의 보안 영역에서 표준으로 사용됩니다.

중요한 점은 Microsoft Entra ID(클라우드)가 RADIUS 프로토콜을 직접 이해하지 못한다는 것입니다. RADIUS는 주로 UDP 기반의 고전적인 방식이기 때문입니다.

그래서 중간에 '통역사'가 필요한데, 그 역할을 하는 것이 바로 **NPS(Network Policy Server) 확장**입니다.

![RADIUS 인증](/assets/images/azure/authn-authz/image-6.png)

### 작동 방식

사용자가 회사 VPN에 접속하는 상황:

1. **접속 시도:** 사용자가 VPN 클라이언트에 Entra ID 계정 정보를 입력합니다.
2. **요청 전달:** VPN 장비(RADIUS 클라이언트)가 사내에 설치된 **NPS 서버**로 인증 요청을 보냅니다.
3. **1차 인증:** NPS 서버는 온프레미스 AD(Active Directory)를 통해 아이디와 비밀번호가 맞는지 먼저 확인합니다.
4. **MFA 요청:** 비밀번호가 맞으면, NPS에 설치된 **Microsoft Entra MFA 확장**이 클라우드(Entra ID)에 "이 사용자 MFA 확인해줘!"라고 요청을 보냅니다.
5. **2차 인증:** 사용자의 스마트폰(Microsoft Authenticator 앱)으로 승인 알림이 가고, 사용자가 승인합니다.
6. **접속 허용:** 모든 인증이 완료되면 NPS가 VPN 장비에 "통과"라고 응답하여 접속이 성사됩니다.

## 8. 원격 데스크톱 게이트웨이(RD Gateway) 서비스

**RD Gateway**는 외부 네트워크의 사용자가 방화벽 내부의 윈도우 기반 데스크톱이나 서버에 안전하게 접속할 수 있게 해주는 중계 서버입니다.

- **기술적 핵심:** RDP 트래픽을 HTTPS(Port 443)로 캡슐화하여 전달합니다. 즉, 보안에 취약한 3389 포트를 외부로 열지 않고도 표준 웹 포트인 443을 통해 원격 접속이 가능하게 합니다.
- **비유:** 사내의 모든 컴퓨터로 통하는 '보안 검문소'와 같습니다. 외부에서 들어오는 모든 RDP 요청은 반드시 이 검문소를 거쳐야만 내부망으로 진입할 수 있습니다.

![RD Gateway](/assets/images/azure/authn-authz/image-7.png)

Microsoft Entra ID와 연동할 때 가장 권장되는 방식은 Microsoft Entra 애플리케이션 프록시(Application Proxy)를 사용하는 것입니다.

### 시스템 구성 요소

1. **사용자:** 원격 접속을 시도하는 주체.
2. **웹 브라우저:** RD 웹 포털에 접속하여 사용 가능한 데스크톱 목록을 확인하는 도구.
3. **Microsoft Entra ID:** 사용자를 인증하고 **조건부 액세스(Conditional Access)** 및 **MFA**를 적용하는 두뇌 역할.
4. **애플리케이션 프록시 서비스:** 외부 요청을 수신하여 내부망의 RD 게이트웨이로 전달하는 **역방향 프록시(Reverse Proxy)**.
5. **원격 데스크톱 서비스(RDS):** 실제 RD 웹, RD 게이트웨이, 세션 호스트 등이 포함된 내부 인프라.

### 작동 방식

- **외부 접속:** 사용자가 앱 프록시가 제공하는 외부 URL(예: `https://rdg-contoso.msappproxy.net`)로 접속합니다.
- **사전 인증(Pre-authentication):** 사용자가 실제 사내 서버에 닿기도 전에 **Microsoft Entra ID**가 먼저 사용자를 가로막습니다. 여기서 MFA가 작동하고, 허용된 장치인지 등을 검사합니다.
- **토큰 발급:** 인증이 성공하면 Entra ID는 사용자를 신뢰한다는 토큰을 줍니다.
- **내부 전달:** 앱 프록시 커넥터가 이 요청을 내부망의 RD 웹 및 RD 게이트웨이로 안전하게 전달합니다.
- **RDP 세션 시작:** 사용자가 RD 웹에서 원하는 PC를 클릭하면, RD 게이트웨이를 통해 암호화된 RDP 터널이 생성되며 최종적으로 내부 자원에 접속하게 됩니다.

## 9. SSH (Secure Shell)

**SSH**는 네트워크상의 다른 컴퓨터에 로그인하거나 원격 시스템에서 명령을 실행하기 위한 **보안 통신 프로토콜**입니다.

Microsoft Entra ID를 사용한 SSH 인증의 핵심은 "정적인 키 파일을 버리고, 사용자의 클라우드 신원(Identity)을 직접 사용한다"는 것입니다.

- **기술적 메커니즘:** 사용자가 SSH 접속을 시도하면, Entra ID는 일시적으로 유효한 '단기 인증서(Short-lived Certificate)'를 발행합니다. 이 인증서는 요청한 즉시 생성되어 접속 후 곧 만료되므로, 키 탈취 위험이 획기적으로 줄어듭니다.

![SSH 인증](/assets/images/azure/authn-authz/image-8.png)

### 작동 방식

사용자가 Azure에 있는 리눅스 VM에 SSH로 접속하는 과정:

1. **로그인 요청:** 사용자가 터미널에서 `az ssh vm`과 같은 명령을 입력합니다.
2. **인증:** 브라우저가 열리며 Microsoft Entra ID 로그인 창이 뜹니다. 여기서 MFA(2단계 인증)를 통과해야 합니다.
3. **토큰 및 인증서 발급:** 인증이 성공하면 Entra ID는 사용자의 신원이 확인되었다는 토큰을 발행하고, 이를 바탕으로 SSH 단기 인증서를 생성합니다.
4. **접속:** 생성된 인증서가 자동으로 리눅스 서버에 전달되어 세션이 수립됩니다.
5. **인가(RBAC) 확인:** 서버는 사용자가 로그인만 했는지, 아니면 'Virtual Machine Administrator' 권한이 있어 루트(root) 권한까지 쓸 수 있는지 Azure의 RBAC 정책을 확인합니다.

## 10. SAML 인증 (Security Assertion Markup Language)

**SAML**은 ID 제공자(IdP)와 서비스 제공자(SP) 간에 **XML 형식**으로 인증 및 인가 데이터를 주고받기 위한 개방형 표준입니다.

- **비유:** '인감 증명서'와 같습니다. 내가 누구인지 직접 말하는 대신, 믿을 수 있는 기관(Entra ID)에서 떼어준 인감 증명서(SAML Assertion)를 앱에 제출하는 방식입니다. 앱은 그 종이에 찍힌 인감(디지털 서명)이 진짜인지 확인하고 문을 열어줍니다.
- **특징:** OAuth/OIDC가 JSON을 쓴다면, SAML은 **XML**을 사용하며 훨씬 더 방대하고 정교한 정보를 담을 수 있습니다.

작동 원리: XML 기반의 `Assertion`을 IdP(Entra ID)와 SP(SaaS 앱) 간에 교환하여 인증을 완료합니다.
장점: 대규모 엔터프라이즈 환경에서 매우 안정적이며 보안 설정이 세밀합니다.

![SAML 인증](/assets/images/azure/authn-authz/image-9.png)

### SAML 아키텍처의 3대 요소

1. **사용자 (Principal):** 서비스를 이용하려는 직원입니다.
2. **ID 공급자 (Identity Provider, IdP):** 사용자의 신원을 확인하고 보증서를 끊어주는 **Microsoft Entra ID**입니다.
3. **서비스 공급자 (Service Provider, SP):** 사용자가 접속하려는 애플리케이션(예: Salesforce, AWS Console 등)입니다.

### 작동 방식

앱에 먼저 접속했을 때:

1. **앱 접속:** 사용자가 Salesforce에 접속합니다.
2. **SAML 요청 생성:** Salesforce(SP)는 "이 사람 누군지 확인해줘"라는 **SAML Request**를 만들어 사용자의 브라우저를 Entra ID로 보냅니다(Redirect).
3. **인증:** 사용자는 **Microsoft Entra ID(IdP)** 로그인 화면에서 로그인하고 MFA를 통과합니다.
4. **보증서 발급:** 인증이 성공하면 Entra ID는 사용자의 정보와 서명이 담긴 XML 뭉치, 즉 **SAML Assertion**을 생성하여 브라우저에 줍니다.
5. **보증서 제출:** 브라우저는 이 Assertion을 다시 Salesforce(SP)로 전달합니다.
6. **검증 및 로그인:** Salesforce는 Entra ID의 공개키로 서명을 검증한 후, 사용자를 로그인시켜 줍니다.

## 11. Windows 인증 - Kerberos 제한 위임 (KCD)

- **Kerberos:** 윈도우 네트워크에서 사용하는 표준 인증 프로토콜입니다. 아이디/비밀번호 대신 '티켓(Ticket)'이라는 증표를 주고받으며 인증합니다.
- **제한 위임 (Constrained Delegation):** 서비스(예: 웹 서버)가 사용자를 대신하여 다른 서비스(예: DB 서버)에 접근할 수 있도록 권한을 '위임'받는 것입니다. '제한'이라는 말이 붙은 이유는 **"특정 서비스에 대해서만"** 위임이 가능하도록 보안을 강화했기 때문입니다.

![Kerberos KCD](/assets/images/azure/authn-authz/image-10.png)

### 작동 방식

이 과정은 마치 '신분증 번역 및 대리 수행'과 같습니다.

1. **외부 접속:** 사용자가 외부에서 Entra 애플리케이션 프록시 URL로 접속합니다.
2. **사전 인증:** **Microsoft Entra ID**가 사용자를 인증합니다(MFA 포함).
3. **요청 전달:** 인증된 요청이 내부망에 설치된 애플리케이션 프록시 커넥터(Connector)로 전달됩니다.
4. **KCD 마법 (핵심):** 커넥터는 사용자의 신원(UPN 등)을 확인한 후, 온프레미스 AD에 가서 이렇게 말합니다.
    > "AD야, 방금 '홍길동'이 클라우드에서 인증받고 왔어. 내가 홍길동을 대신해서(Impersonation) 이 웹 서버에 들어갈 수 있게 Kerberos 티켓 하나만 끊어줘."
5. **티켓 획득:** AD는 커넥터의 권한을 확인하고 홍길동의 이름이 적힌 Kerberos 티켓을 발급합니다.

## 🏛️ 최종 요약 비교

| 구분 | 프로토콜 | 주요 대상 | 보안 수준 | 비유 |
| --- | --- | --- | --- | --- |
| 모던 인증 (Modern) | OIDC | 최신 웹 애플리케이션 로그인 | 최상 | 현대적 웹 환경의 표준 신분증 |
| 모던 인가 (Modern) | OAuth 2.0 | 모바일 앱, REST API 접근 권한 | 최상 | 비밀번호 없이 자원 접근을 허용하는 만능 열쇠 |
| 페더레이션 (SaaS) | SAML 2.0 | 외부 SaaS(Slack, Salesforce 등) 연동 | 상 | 기업 간 신뢰를 바탕으로 한 엔터프라이즈 SSO의 정석 |
| 인프라 보안 (Infra) | SSH | 리눅스(Linux) VM 원격 관리 | 상 | 정적 키 관리의 고통을 없애주는 신원 기반 접속 |
| 인프라 보안 (Infra) | RADIUS | VPN, 사내 Wi-Fi, 네트워크 장비 | 상 | 네트워크 관문에 클라우드 MFA를 입히는 보안 가교 |
| 원격 접속 (Remote) | RD Gateway | 내부망 Windows 서버/데스크톱 RDP | 상 | 외부 노출 없이 HTTPS 터널로 안전한 원격 제어 |
| 레거시 연동 (Hybrid) | KCD (Kerberos) | 온프레미스 Windows 통합 인증(IWA) 앱 | 중/상 | 클라우드 신원을 Kerberos 티켓으로 바꾸는 마법 |
| 레거시 연동 (Hybrid) | Header-based | 자체 개발 레거시 웹 앱 (소스 수정 불가) | 중 | 프록시가 주입하는 헤더 정보로 간편하게 SSO 구현 |
| 레거시 연동 (Hybrid) | LDAP | 사내 서버, 프린터, 디렉터리 조회 앱 | 중 | 전통적인 디지털 전화번호부 방식의 표준 통신 |
| 임시 조치 (Basic) | Password-based | 현대적 프로토콜 미지원 구형 웹 사이트 | 하/중 | 브라우저 비서가 암호를 대신 입력해주는 과도기적 대안 |
