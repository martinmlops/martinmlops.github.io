---
title: "Azure 네트워크 보안 서비스 - Firewall, WAF, DDoS, VPN, ExpressRoute"
date: 2026-02-15
categories: [Azure, Azure 네트워크]
tags: [Azure, Firewall, WAF, DDoS, VPN Gateway, ExpressRoute, Network Watcher, Security]
toc: true
toc_sticky: true
---

## 계층적 보안 (Defense in Depth)

```
L1: 네트워크 경계  → DDoS Protection + Azure Firewall
L2: 웹 애플리케이션 → WAF (OWASP Top 10, Bot 보호)
L3: 네트워크 세그먼트 → NSG (서브넷/NIC 필터링)
L4: 호스트          → VM 방화벽, 안티바이러스
L5: 애플리케이션    → 코드 보안, 인증/인가
L6: 데이터          → 암호화 (at rest, in transit)
```

## 1. Azure Firewall

완전 관리형 클라우드 네이티브 네트워크 보안 서비스입니다.

### SKU 비교

| 기능 | Basic | Standard | Premium |
|------|-------|----------|---------|
| 처리량 | 250 Mbps | 30 Gbps | 100 Gbps |
| 가용성 영역 | ❌ | ✅ | ✅ |
| 위협 인텔리전스 | ❌ | ✅ | ✅ |
| TLS 검사 | ❌ | ❌ | ✅ |
| IDPS | ❌ | ❌ | ✅ |
| URL 필터링 | ❌ | ❌ | ✅ |
| 가격 | 낮음 | 중간 | 높음 |
| 사용 사례 | 소규모/테스트 | 프로덕션 | 금융/의료 |

### 규칙 처리 순서

```
Incoming Traffic
  → 1. NAT Rules (DNAT 인바운드)
  → 2. Network Rules (IP/Port/Protocol)
  → 3. Application Rules (FQDN/HTTP/HTTPS)
  → 4. Threat Intel (Microsoft 위협 데이터)
  → Allow/Deny
```

### Premium 전용 기능

1. **TLS 검사**: 아웃바운드 트래픽 복호화 → 위협 탐지 → 재암호화. Key Vault에서 CA 인증서를 가져와 클라이언트와 별도의 TLS 세션을 수립합니다.
2. **IDPS**: 시그니처 기반 위협 탐지, 악성 트래픽 실시간 차단. Alert 또는 Alert and Deny 모드 선택 가능.
3. **URL 필터링**: 전체 URL 경로 기반 필터링 (FQDN 필터링보다 세밀한 제어)
4. **웹 카테고리**: 카테고리 기반 아웃바운드 액세스 제어 (도박, 소셜 미디어 등 차단)

### TLS 검사 흐름

```
클라이언트 → HTTPS 요청 → Azure Firewall Premium
                              ↓
                    Key Vault에서 CA 인증서 가져오기
                              ↓
                    Firewall 인증서로 TLS 세션 수립
                              ↓
                    트래픽 복호화 → IDPS 검사 → URL 필터링
                              ↓
                    정상: 대상 서버로 전송 / 위협: 차단 (403)
```

## 2. Azure WAF (Web Application Firewall)

OWASP Top 10 위협에 대한 보호를 제공합니다.

### 배포 옵션

| 옵션 | 범위 | 특징 |
|------|------|------|
| Application Gateway WAF | 리전별 | VNet 통합, 백엔드와 동일 리전 |
| Front Door WAF | 글로벌 | 엣지 네트워크에서 보호 |
| Azure CDN WAF | 글로벌 | CDN과 통합 |

### 규칙 유형

**관리형 규칙**: OWASP CRS 3.2, Bot Protection, Threat Intelligence (자동 업데이트)

**사용자 지정 규칙**: IP 기반 허용/차단, 지리적 필터링, 속도 제한(Rate Limiting)

### 보호 대상 위협
- SQL Injection
- Cross-Site Scripting (XSS)
- Remote File Inclusion
- Command Injection
- HTTP Protocol Violations

### WAF 모드
- **Detection (탐지)**: 위협 로깅만 수행, 차단하지 않음
- **Prevention (방지)**: 위협 탐지 및 차단

> 권장: Detection 모드에서 오탐 확인 후 Prevention 모드로 전환

## 3. Azure DDoS Protection

### 보호 계층

| 계층 | 비용 | 보호 범위 |
|------|------|-----------|
| Infrastructure Protection | 무료 | 모든 Azure 서비스 기본 |
| Network Protection | VNet 단위 요금 | VNet 내 모든 공용 IP |
| IP Protection | IP당 요금 | 특정 공용 IP만 |

### 공격 유형 보호

- **Volumetric Attacks**: 대역폭 소진 (UDP/ICMP Flood)
- **Protocol Attacks**: 프로토콜 취약점 악용 (SYN Flood)
- **Resource Layer Attacks**: 애플리케이션 계층 (HTTP Flood)

### DDoS Rapid Response (DRR)
- 활성 공격 중 Microsoft DDoS 전문가 지원
- 공격 분석 및 사후 보고서
- Network Protection에 포함

## 4. VPN Gateway

온프레미스 네트워크와 Azure VNet 간 암호화된 연결을 제공합니다.

### 연결 유형 비교

| 특징 | Site-to-Site | Point-to-Site | VNet-to-VNet |
|------|-------------|---------------|--------------|
| 연결 대상 | 네트워크 전체 | 개별 클라이언트 | Azure VNet 간 |
| VPN 디바이스 필요 | ✅ | ❌ | ❌ |
| 영구 연결 | ✅ | ❌ (온디맨드) | ✅ |
| 사용 사례 | 하이브리드 클라우드 | 원격 액세스 | 다중 VNet 연결 |

### P2S VPN 프로토콜 비교

| 프로토콜 | 포트 | 플랫폼 | 방화벽 통과 | 성능 |
|----------|------|--------|-------------|------|
| OpenVPN | TCP 443 | 모든 OS | 우수 | 좋음 |
| SSTP | TCP 443 | Windows만 | 우수 | 보통 |
| IKEv2 | UDP 500/4500 | 모든 OS | 보통 | 우수 |

### 고가용성 구성

**Active-Standby (기본)**: 페일오버 60-90초

**Active-Active**: 처리량 2배, 동시 활성

**Zone-Redundant (AZ SKU)**: SLA 99.99%, 리전 수준 복원력

### SKU 선택 가이드

| SKU | 처리량 | S2S 터널 | P2S 연결 | 가용성 영역 | SLA |
|-----|--------|----------|----------|-------------|-----|
| VpnGw1 | 650 Mbps | 30 | 250 | ❌ | 99.9% |
| VpnGw2 | 1 Gbps | 30 | 500 | ❌ | 99.9% |
| VpnGw2AZ | 1 Gbps | 30 | 500 | ✅ | 99.99% |
| VpnGw5AZ | 10 Gbps | 100 | 10000 | ✅ | 99.99% |

## 5. ExpressRoute

온프레미스 네트워크와 Microsoft 클라우드 간 프라이빗 전용 연결을 제공합니다.

### 연결 모델

1. **CloudExchange Co-location**: 데이터 센터가 클라우드 교환 시설에 위치
2. **Point-to-Point Ethernet**: 직접 이더넷 연결
3. **Any-to-Any (IPVPN)**: MPLS VPN을 통한 연결
4. **ExpressRoute Direct**: Microsoft 글로벌 네트워크에 직접 연결 (10/100 Gbps)

### ExpressRoute vs VPN Gateway

| 특징 | ExpressRoute | VPN Gateway |
|------|-------------|-------------|
| 연결 유형 | 프라이빗 전용 | 공용 인터넷 |
| 대역폭 | 50 Mbps ~ 100 Gbps | 100 Mbps ~ 10 Gbps |
| 지연시간 | 낮고 일관적 (1-5ms) | 변동 가능 (10-100ms+) |
| 비용 | 높음 | 낮음 |
| 설정 시간 | 몇 주 ~ 몇 달 | 몇 시간 |
| SLA | 99.95% | 99.9% ~ 99.99% |
| Microsoft 365 | ✅ (Microsoft Peering) | ❌ |

### 피어링 유형

- **Private Peering**: Azure VNet 내 리소스 액세스 (RFC 1918 프라이빗 IP)
- **Microsoft Peering**: Microsoft 365, Dynamics 365, Azure 공용 서비스 액세스

## 6. Azure Network Watcher

Azure IaaS 리소스를 모니터링, 진단하는 도구 모음입니다.

### 모니터링 도구

| 도구 | 기능 |
|------|------|
| Topology | VNet 시각적 표현, 리소스 관계도 |
| Connection Monitor | 지속적 연결 모니터링, 지연시간 추적 |
| Network Performance Monitor | 하이브리드 네트워크 성능, ExpressRoute 모니터링 |

### 진단 도구

| 도구 | 기능 |
|------|------|
| IP Flow Verify | NSG 규칙 테스트, 패킷 허용/거부 확인 |
| Next Hop | 라우팅 경로 확인, UDR 검증 |
| Connection Troubleshoot | 엔드투엔드 연결 테스트 |
| Packet Capture | 네트워크 트래픽 캡처 (Wireshark 분석) |
| VPN Troubleshoot | VPN Gateway 진단 |
| NSG Diagnostics | NSG 규칙 평가 |

### 문제 해결 워크플로

```
VM 간 연결 실패
  → Step 1: IP Flow Verify (NSG 차단?) → Yes: NSG 규칙 수정
  → Step 2: Next Hop (라우팅 올바른가?) → No: UDR 수정
  → Step 3: Connection Troubleshoot (엔드투엔드?) → No: Step 4
  → Step 4: Packet Capture (상세 패킷 분석)
```

## 네트워크 기반 서비스

### Azure Private Link

VNet에서 공용 인터넷을 거치지 않고 Azure 서비스에 안전하게 접근합니다.

- 프라이빗 엔드포인트: VNet 내 프라이빗 IP로 서비스 연결
- 프라이빗 DNS 영역과 통합
- 온프레미스에서 VPN/ExpressRoute를 통해 직접 접근 가능

### Azure DNS

- 공용 DNS: 글로벌 인프라, Anycast 네트워크
- 프라이빗 DNS: VNet 내 프라이빗 서비스 이름 확인
- DNS Private Resolver: 하이브리드 DNS 확인

## 비용 최적화 가이드

| 서비스 | 월 예상 비용 | 최적화 팁 |
|--------|-------------|-----------|
| Load Balancer | $20-100 | 규칙 통합 |
| Application Gateway | $150-500 | 자동 확장 최소값 조정 |
| Front Door | $300-1000+ | 캐싱 활용 |
| Azure Firewall | $800-2000+ | 적절한 SKU 선택 |
| VPN Gateway | $100-500 | 적절한 SKU 선택 |
| ExpressRoute | $500-5000+ | 적절한 대역폭 선택 |
| DDoS Protection | $3000/월 | 여러 VNet에 Plan 재사용 |

## 보안 모범 사례

| 영역 | 모범 사례 |
|------|-----------|
| Defense in Depth | DDoS → Firewall → WAF → NSG |
| 최소 권한 | NSG 규칙 최소화, 명시적 허용 |
| 중앙 집중화 | Hub-Spoke 아키텍처, Azure Firewall을 Hub에 배치 |
| WAF 모드 | Detection → Prevention (오탐 확인 후 전환) |
| 암호화 | TLS 1.2+, Storage 암호화 |
| 정기 검토 | 보안 규칙 분기별 검토 |

## 참고 자료

- [Azure Firewall Premium 기능](https://learn.microsoft.com/azure/firewall/premium-features)
- [WAF 정책 개요](https://learn.microsoft.com/azure/web-application-firewall/)
- [DDoS Protection 모범 사례](https://learn.microsoft.com/azure/security/fundamentals/ddos-best-practices)
- [VPN Gateway FAQ](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-vpn-faq)
- [ExpressRoute 연결 모델](https://learn.microsoft.com/azure/expressroute/expressroute-connectivity-models)
- [Network Watcher 개요](https://learn.microsoft.com/azure/network-watcher/)
