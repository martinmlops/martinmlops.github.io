---
title: "Azure 네트워킹 아키텍처 다이어그램 모음"
date: 2026-02-22
categories: [Azure, Azure 네트워크]
tags: [Azure, Network, Architecture, Mermaid, Diagram, Load Balancer, Firewall, ExpressRoute]
toc: true
toc_sticky: true
---

## 개요

Azure 네트워킹 서비스의 핵심 개념과 아키텍처를 Mermaid 다이어그램으로 시각화합니다.

## 1. 부하분산 서비스 계층 구조

```mermaid
graph TB
    subgraph "글로벌 계층"
        TM[Traffic Manager - DNS 기반 라우팅]
        AFD[Azure Front Door - Layer 7 글로벌 CDN]
    end
    subgraph "리전 계층"
        AGW[Application Gateway - Layer 7 리전별]
        ALB[Azure Load Balancer - Layer 4 고성능]
    end
    subgraph "백엔드"
        VM1[Virtual Machines]
        VMSS[VM Scale Sets]
        AKS[AKS Cluster]
        APP[App Services]
    end
    Internet((Internet)) --> TM
    Internet --> AFD
    TM --> AGW
    TM --> ALB
    AFD --> AGW
    AGW --> VM1
    AGW --> VMSS
    AGW --> APP
    ALB --> VM1
    ALB --> VMSS
    ALB --> AKS
```

## 2. 보안 서비스 통합 아키텍처

```mermaid
graph TB
    subgraph "인터넷 경계"
        Internet((Internet))
        DDoS[DDoS Protection]
    end
    subgraph "엣지 보안"
        AFD_WAF[Front Door + WAF]
    end
    subgraph "리전 보안"
        AGW_WAF[Application Gateway + WAF]
    end
    subgraph "Hub VNet"
        AZF[Azure Firewall Premium]
        VPNGW[VPN Gateway]
        ER[ExpressRoute]
    end
    subgraph "Spoke VNets"
        NSG1[NSG + ASG]
        Workload[워크로드 리소스]
    end
    Internet --> DDoS
    DDoS --> AFD_WAF
    AFD_WAF --> AGW_WAF
    AGW_WAF --> AZF
    AZF --> NSG1
    NSG1 --> Workload
    OnPrem[온프레미스] --> VPNGW
    OnPrem --> ER
    VPNGW --> AZF
    ER --> AZF
```

## 3. 하이브리드 네트워크 연결

```mermaid
graph LR
    subgraph "온프레미스"
        DC[데이터 센터]
        Branch[지사]
        Remote[원격 사용자]
    end
    subgraph "연결 계층"
        ER[ExpressRoute - 최대 100 Gbps]
        VPN_S2S[VPN Gateway S2S - IPsec]
        VPN_P2S[VPN Gateway P2S - 최대 10000 연결]
    end
    subgraph "Azure Hub"
        HubVNet[Hub VNet]
        AZF[Azure Firewall]
    end
    subgraph "Azure Spokes"
        Spoke1[Spoke VNet 1 - 프로덕션]
        Spoke2[Spoke VNet 2 - 개발]
        Spoke3[Spoke VNet 3 - 테스트]
    end
    DC -->|주 연결| ER
    DC -->|백업| VPN_S2S
    Branch --> VPN_S2S
    Remote --> VPN_P2S
    ER --> HubVNet
    VPN_S2S --> HubVNet
    VPN_P2S --> HubVNet
    HubVNet --> AZF
    AZF --> Spoke1
    AZF --> Spoke2
    AZF --> Spoke3
```

## 4. Network Watcher 진단 흐름

```mermaid
graph TD
    Start[네트워크 문제 발생] --> Q1{문제 유형?}
    Q1 -->|연결 불가| IPFlow[IP Flow Verify]
    Q1 -->|라우팅 문제| NextHop[Next Hop]
    Q1 -->|성능 저하| ConnMon[Connection Monitor]
    Q1 -->|간헐적 문제| PacketCap[Packet Capture]
    IPFlow --> Result1{차단됨?}
    Result1 -->|Yes| Fix1[NSG 규칙 수정]
    Result1 -->|No| NextHop
    NextHop --> Result2{라우팅 OK?}
    Result2 -->|No| Fix2[UDR 수정]
    Result2 -->|Yes| ConnTrouble[Connection Troubleshoot]
    ConnTrouble --> Result3{연결 성공?}
    Result3 -->|No| PacketCap
    Result3 -->|Yes| Monitor[지속 모니터링]
    PacketCap --> Analysis[Wireshark 분석]
    Analysis --> Fix3[근본 원인 해결]
```

## 5. Azure Firewall Premium TLS 검사 흐름

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant AFW as Azure Firewall Premium
    participant KV as Key Vault
    participant Dest as 대상 서버
    Note over Client,Dest: TLS 검사 흐름
    Client->>AFW: HTTPS 요청 (암호화)
    AFW->>KV: CA 인증서 가져오기
    KV-->>AFW: CA 인증서 반환
    AFW->>Client: Firewall 인증서로 TLS 세션 수립
    Note over AFW: 트래픽 복호화
    AFW->>AFW: IDPS 시그니처 검사
    AFW->>AFW: URL 필터링
    AFW->>AFW: 웹 카테고리 확인
    alt 위협 탐지
        AFW-->>Client: 차단 (403 Forbidden)
    else 정상 트래픽
        AFW->>Dest: 원본 대상으로 전송
        Dest-->>AFW: 응답
        AFW->>Client: 응답 전달
    end
```

## 6. ExpressRoute 아키텍처

```mermaid
graph TB
    subgraph "온프레미스"
        OnPrem[온프레미스 네트워크]
        CE[Customer Edge Router]
    end
    subgraph "연결 공급자"
        Provider[연결 공급자]
    end
    subgraph "Microsoft Edge"
        MSEE1[Microsoft Edge Router 1]
        MSEE2[Microsoft Edge Router 2]
    end
    subgraph "Azure"
        ERGw[ExpressRoute Gateway]
        VNet[Virtual Network]
        subgraph "피어링"
            Private[Private Peering - VNet 리소스]
            Microsoft[Microsoft Peering - M365]
        end
    end
    OnPrem --> CE
    CE -->|주 경로| Provider
    CE -->|보조 경로| Provider
    Provider --> MSEE1
    Provider --> MSEE2
    MSEE1 --> Private
    MSEE2 --> Private
    MSEE1 --> Microsoft
    MSEE2 --> Microsoft
    Private --> ERGw
    ERGw --> VNet
```

## 7. WAF 정책 구조

```mermaid
graph TD
    WAF[WAF Policy]
    WAF --> Custom[사용자 지정 규칙]
    WAF --> Managed[관리형 규칙]
    WAF --> Settings[정책 설정]
    Custom --> Rule1[IP 기반 규칙]
    Custom --> Rule2[지리적 필터링]
    Custom --> Rule3[속도 제한]
    Managed --> OWASP[OWASP CRS 3.2]
    Managed --> Bot[Bot Protection]
    Managed --> Threat[Threat Intelligence]
    OWASP --> SQL[SQL Injection]
    OWASP --> XSS[Cross-Site Scripting]
    OWASP --> RFI[Remote File Inclusion]
    Settings --> Mode[Detection / Prevention]
    Settings --> Exclusion[제외 규칙]
```

## 8. DDoS Protection 완화 흐름

```mermaid
graph TB
    Attack[DDoS 공격 시작] --> Detection[트래픽 모니터링 - 이상 탐지]
    Detection --> Analysis{공격 유형 분석}
    Analysis -->|Volumetric| Vol[용량 공격 - UDP/ICMP Flood]
    Analysis -->|Protocol| Proto[프로토콜 공격 - SYN Flood]
    Analysis -->|Application| App[애플리케이션 공격 - HTTP Flood]
    Vol --> Scrub[트래픽 스크러빙]
    Proto --> Scrub
    App --> Scrub
    Scrub --> Filter[악성 트래픽 필터링]
    Filter --> Clean[정상 트래픽만 통과]
    Clean --> App_Server[애플리케이션 서버]
    Detection --> Alert[Azure Monitor 알림]
    Alert --> DRR[DDoS Rapid Response]
```

## 네트워크 설계 모범 사례

### IP 주소 계획

```
Hub VNet: 10.0.0.0/16
  - GatewaySubnet: 10.0.255.0/27
  - AzureFirewallSubnet: 10.0.254.0/26
  - Management: 10.0.1.0/24

Spoke VNet 1: 10.1.0.0/16
  - Web Tier: 10.1.1.0/24
  - App Tier: 10.1.2.0/24
  - Data Tier: 10.1.3.0/24
```

### NSG 규칙 설계 원칙

```
Priority 100: Allow HTTPS from Internet
Priority 200: Allow RDP from Management Subnet
Priority 300: Allow SQL from App Subnet
Priority 4096: Deny All (기본 규칙)
```

## 참고 자료

- [Azure 네트워킹 문서](https://learn.microsoft.com/azure/networking/)
- [Azure 아키텍처 센터](https://learn.microsoft.com/azure/architecture/)
- [AZ-700: Azure 네트워크 엔지니어 인증](https://learn.microsoft.com/certifications/azure-network-engineer-associate/)
- [Mermaid Live Editor](https://mermaid.live/)
