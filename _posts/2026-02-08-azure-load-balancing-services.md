---
title: "Azure 부하분산 서비스 Deep Dive - ALB, App Gateway, Front Door, Traffic Manager"
date: 2026-02-08
categories: [Azure, Azure 네트워크]
tags: [Azure, Load Balancer, Application Gateway, Front Door, Traffic Manager, WAF, CDN]
toc: true
toc_sticky: true
---

## 부하분산 서비스 계층 구조

Azure는 Layer 4와 Layer 7에서 리전/글로벌 수준의 부하분산 서비스를 제공합니다.

```
글로벌 계층: Traffic Manager (DNS) / Front Door (Layer 7 CDN)
리전 계층:  Application Gateway (Layer 7) / Load Balancer (Layer 4)
백엔드:     VMs / VMSS / AKS / App Services
```

## 1. Azure Application Gateway

Layer 7 (애플리케이션 계층) 웹 트래픽 로드 밸런서입니다.

### 핵심 기능

- **URL 기반 라우팅**: `/api/*` → Pool1, `/web/*` → Pool2
- **호스트 기반 라우팅**: 호스트 이름에 따른 라우팅
- **SSL/TLS 종료**: SSL 오프로딩으로 백엔드 서버 부하 감소
- **자동 확장**: 트래픽 패턴에 따른 자동 스케일링
- **세션 어피니티**: 쿠키 기반 세션 유지
- **WAF 통합**: 웹 애플리케이션 방화벽 기능 내장

### SKU 비교

| 기능 | Standard_v2 | WAF_v2 |
|------|-------------|--------|
| 자동 확장 | ✅ | ✅ |
| 영역 중복성 | ✅ | ✅ |
| WAF | ❌ | ✅ |
| 최대 인스턴스 | 125 | 125 |
| 가격 | 낮음 | 높음 |

### 사용 사례
- 마이크로서비스 아키텍처의 API 게이트웨이
- 멀티 테넌트 애플리케이션
- 경로 기반 라우팅이 필요한 웹 애플리케이션

## 2. Azure Load Balancer

Layer 4 (전송 계층) 로드 밸런서로 TCP/UDP 트래픽을 분산합니다.

### SKU 비교

| 기능 | Basic | Standard |
|------|-------|----------|
| 백엔드 풀 크기 | 최대 300 | 최대 1000 |
| 상태 프로브 | HTTP, TCP | HTTP, HTTPS, TCP |
| 가용성 영역 | ❌ | ✅ |
| SLA | 없음 | 99.99% |
| 보안 기본값 | 열림 | 닫힘 (NSG 필수) |
| 상태 | 사용 중단 예정 | **권장** |

### 부하 분산 알고리즘

| 분산 모드 | 설명 | 사용 사례 |
|-----------|------|-----------|
| 5-tuple 해시 | 소스IP, 소스포트, 대상IP, 대상포트, 프로토콜 | 기본값, 균등 분산 |
| 소스 IP 어피니티 (2-tuple) | 소스IP, 대상IP | 세션 유지 필요 |
| 소스 IP 어피니티 (3-tuple) | 소스IP, 대상IP, 프로토콜 | 프로토콜별 세션 유지 |

### 유형
- **Public Load Balancer**: 인터넷 트래픽을 VM으로 분산
- **Internal Load Balancer**: VNet 내부 트래픽 분산

## 3. Azure Front Door

글로벌 Layer 7 로드 밸런서로 Microsoft의 100개 이상 PoP를 활용합니다.

### 핵심 기능

- **글로벌 로드 밸런싱**: 여러 리전의 백엔드 간 트래픽 분산
- **CDN 기능**: 정적 콘텐츠 캐싱으로 성능 향상
- **WAF 통합**: 엣지에서 보안 위협 차단
- **자동 장애 조치**: 상태 프로브 기반 자동 페일오버
- **Anycast IP**: 가장 가까운 Microsoft 엣지에서 요청 수락

### 트래픽 라우팅 방법

| 라우팅 방법 | 설명 |
|-------------|------|
| Priority | 우선순위 기반 (재해 복구) |
| Weighted | 가중치 기반 분산 (A/B 테스팅) |
| Performance | 지연시간 최소화 |
| Geographic | 지리적 위치 기반 (데이터 주권) |

## 4. Azure Traffic Manager

DNS 기반 글로벌 트래픽 로드 밸런서입니다. 실제 트래픽을 처리하지 않고 DNS 쿼리에 대한 응답으로 최적의 엔드포인트를 반환합니다.

### 6가지 라우팅 방법

**Priority (우선순위)**: 주 엔드포인트 장애 시 보조로 페일오버

**Weighted (가중치)**: 70% → v1.0, 20% → v2.0, 10% → v3.0

**Performance (성능)**: 지연시간 테이블 기반으로 가장 가까운 엔드포인트 반환

**Geographic (지리적)**: 사용자 위치에 따라 특정 리전으로 라우팅 (GDPR 준수)

**Multivalue (다중값)**: 여러 정상 엔드포인트 IP를 반환, 클라이언트가 선택

**Subnet (서브넷)**: IP 범위에 따라 내부/외부 엔드포인트 분리

## 부하분산 서비스 상세 비교

| 기준 | Load Balancer | App Gateway | Front Door | Traffic Manager |
|------|---------------|-------------|------------|-----------------|
| OSI 계층 | Layer 4 | Layer 7 | Layer 7 | Layer 7 (DNS) |
| 범위 | 리전 | 리전 | 글로벌 | 글로벌 |
| 프로토콜 | TCP, UDP | HTTP/S | HTTP/S | 모든 프로토콜 |
| WAF | ❌ | ✅ | ✅ | ❌ |
| SSL 오프로드 | ❌ | ✅ | ✅ | ❌ |
| CDN | ❌ | ❌ | ✅ | ❌ |
| 페일오버 속도 | 빠름 | 빠름 | 매우 빠름 | 느림 (DNS TTL) |
| 가격 | 낮음 | 중간 | 높음 | 낮음 |

## 선택 가이드

| 요구사항 | 추천 서비스 | 이유 |
|----------|-------------|------|
| 리전 내 VM 부하분산 | Load Balancer | 고성능, 초저지연, Layer 4 |
| 리전 내 웹 앱 + WAF | Application Gateway | Layer 7, SSL 오프로드, 보안 |
| 글로벌 웹 앱 + CDN | Front Door | 엣지 최적화, 글로벌 분산 |
| DNS 기반 페일오버 | Traffic Manager | 저비용, 모든 프로토콜 지원 |
| 마이크로서비스 API | Application Gateway | URL 라우팅, 세션 관리 |

## 일반적인 아키텍처 패턴

### 패턴 1: 글로벌 고가용성

```
Traffic Manager (DNS)
  → Front Door (글로벌 Layer 7)
    → Application Gateway (리전별 Layer 7)
      → Load Balancer (VM 부하분산)
```

### 패턴 2: 다중 리전 Active-Active

```
Traffic Manager (DNS)
  → East US: Front Door → App Gateway → Backend Pool
  → West EU: Front Door → App Gateway → Backend Pool
  → East Asia: Front Door → App Gateway → Backend Pool

특징: 가용성 99.99%+ | 성능 최적 (지역별)
```

### 패턴 3: Hub-Spoke 보안 중심

```
Internet → DDoS Protection → Azure Firewall (Hub VNet)
  → Spoke VNet 1 (Production): App Gateway
  → Spoke VNet 2 (Dev/Test): VMs
  → Spoke VNet 3 (DMZ): Public Services
```

## 참고 자료

- [Application Gateway 공식 문서](https://learn.microsoft.com/azure/application-gateway/)
- [Load Balancer SKU 비교](https://learn.microsoft.com/azure/load-balancer/skus)
- [Front Door 아키텍처 모범 사례](https://learn.microsoft.com/azure/well-architected/service-guides/azure-front-door)
- [Traffic Manager 라우팅 방법](https://learn.microsoft.com/azure/traffic-manager/traffic-manager-routing-methods)
