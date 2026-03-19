---
title: "Azure 네트워크 기초 - VNet, 서브넷, NSG, UDR"
date: 2026-02-01
categories: [Azure, Azure 네트워크]
tags: [Azure, Network, VNet, Subnet, NSG, UDR, ASG, OSI, Accelerated Networking]
toc: true
toc_sticky: true
---

## 네트워크 기초

네트워크는 컴퓨터들이 대화하기 위한 약속(프로토콜)입니다.

### IP 주소

- 공인 IP (Public): 전 세계에서 유일한 주소. 외부와 통신할 때 사용
- 사설 IP (Private): 특정 네트워크(VNet) 내부에서만 쓰는 주소

### MAC 주소

컴퓨터 랜카드에 박혀 있는 고정된 물리적 주소입니다. IP 주소가 "어디(Location)"인지 알려준다면, MAC 주소는 "누구(Identity)"인지 식별합니다.

### 포트

컴퓨터에 도착한 데이터가 어떤 프로그램으로 갈지 결정하는 번호입니다.

| 포트 | 용도 |
|------|------|
| 80/443 | 웹 브라우징 (HTTP/HTTPS) |
| 22 | 서버 원격 접속 (SSH) |
| 3389 | 윈도우 원격 데스크톱 (RDP) |

### 서브넷과 서브넷 마스크

- **서브넷팅**: 네트워크를 관리하기 편하게 쪼개는 것
- **서브넷 마스크**: IP 주소에서 어디까지가 "네트워크 이름"이고 어디서부터가 "컴퓨터 번호"인지 구분하는 선
- 예: `10.0.0.0/24`에서 `/24`는 앞의 24비트가 네트워크 이름이라는 뜻

## OSI 7계층

| 계층 | 이름 | 역할 | PDU | 장비/기술 |
|------|------|------|-----|-----------|
| 7 | 응용 | 사용자 인터페이스 | 데이터 | HTTP, DNS, FTP |
| 6 | 표현 | 데이터 형식 변환, 암호화 | 데이터 | SSL/TLS, JPEG |
| 5 | 세션 | 연결 설정/유지/종료 | 데이터 | SSH, TLS, RPC |
| 4 | 전송 | 신뢰성 있는 데이터 전송 | 세그먼트 | TCP, UDP |
| 3 | 네트워크 | 최적 경로 라우팅 | 패킷 | 라우터, IP, ICMP |
| 2 | 데이터 링크 | 오류 감지, MAC 주소 | 프레임 | 스위치, Ethernet |
| 1 | 물리 | 전기/광학 신호 변환 | 비트 | 허브, 케이블 |

## Azure Virtual Network (VNet)

### VNet 핵심 구성 요소

#### 서브넷: 네트워크의 세밀한 논리적 분할

VNet은 거대한 주소 공간(예: 10.0.0.0/16)이며, 이를 다시 용도에 맞게 쪼갠 것이 서브넷입니다.

**Azure IP 예약**: Azure는 각 서브넷에서 5개의 IP 주소를 관리용으로 예약합니다.
- .0: 네트워크 주소
- .1: 기본 게이트웨이
- .2, .3: Azure DNS 매핑용
- .255: 네트워크 브로드캐스트 주소

따라서 /24(256개) 서브넷을 설계해도 실제 가용한 호스트는 **251개**뿐입니다.

**전용 서브넷**: Azure의 특정 서비스는 이름이 지정된 전용 서브넷을 요구합니다.
- VPN Gateway → `GatewaySubnet`
- Azure Firewall → `AzureFirewallSubnet`
- Azure Bastion → `AzureBastionSubnet`

#### NSG (Network Security Group): L3/L4 상태 저장 방화벽

NSG는 서브넷이나 개별 VM의 NIC에 적용되는 보안 규칙 집합입니다.

**우선순위**: 100~4096 사이의 숫자를 부여하며, 숫자가 낮을수록 우선순위가 높습니다.

**기본 인바운드 규칙**:

| 규칙 이름 | 우선순위 | 원본 | 대상 | 작업 |
|-----------|----------|------|------|------|
| AllowVNetInBound | 65000 | VirtualNetwork | VirtualNetwork | Allow |
| AllowAzureLoadBalancerInBound | 65001 | AzureLoadBalancer | 0.0.0.0/0 | Allow |
| DenyAllInbound | 65500 | 0.0.0.0/0 | 0.0.0.0/0 | Deny |

**상태 저장(Stateful)**: 인바운드로 들어온 트래픽에 대한 응답은 아웃바운드 규칙을 확인하지 않고 무조건 통과시킵니다.

**보강된 보안 규칙**: 여러 IP 주소, 포트 범위를 단일 규칙에 지정 가능합니다.

```json
{
  "name": "Allow-Web-Services",
  "priority": 120,
  "direction": "Inbound",
  "access": "Allow",
  "protocol": "Tcp",
  "sourceAddressPrefix": "Internet",
  "destinationPortRanges": ["80", "443", "8080-8090"]
}
```

#### ASG (Application Security Group): 워크로드 중심의 보안 관리

IP 주소 기반 보안 관리의 한계를 극복하기 위해 도입되었습니다.

- **추상화**: NSG 규칙에서 IP 대신 `Web-ASG`, `DB-ASG` 같은 그룹명 사용
- **유연성**: 오토스케일링으로 VM이 늘어나거나 IP가 바뀌어도 보안 정책 수정 불필요

#### UDR (User Defined Routes): 트래픽 흐름의 설계

Azure는 기본적으로 서브넷 간 통신을 자동으로 라우팅합니다. 특정 목적지로 가는 길을 바꾸고 싶을 때 UDR을 사용합니다.

**강제 터널링**: 모든 인터넷 트래픽을 바로 내보내지 않고, 검사를 위해 NVA나 Azure Firewall로 보내고 싶을 때 사용합니다.

**Next Hop 유형**:
- `VirtualAppliance`: 방화벽 같은 가상 장비의 IP로 전달
- `VirtualNetworkGateway`: VPN/ExpressRoute로 전달
- `None`: 트래픽을 드랍(Drop)

## 서비스 태그

Azure 서비스의 IP 주소 접두사 그룹을 나타내는 정의된 레이블입니다. Microsoft가 자동으로 IP 범위를 업데이트하여 관리 부담을 줄여줍니다.

| 서비스 태그 | 설명 |
|-------------|------|
| AzureCloud | 모든 Azure 데이터센터의 공용 IP |
| Storage | Azure Storage 서비스 |
| Sql | Azure SQL Database |
| AzureKeyVault | Azure Key Vault |
| Internet | 공용 인터넷 IP 주소 공간 |

지역별 태그도 사용 가능합니다: `Storage.KoreaCenter`, `Sql.EastUS`

## 서비스 엔드포인트

Azure 백본 네트워크를 통해 Azure 서비스에 대한 안전하고 직접적인 연결을 제공합니다.

| 구분 | 서비스 엔드포인트 없음 | 서비스 엔드포인트 있음 |
|------|----------------------|----------------------|
| 원본 IP | 공용 IPv4 주소 | VNet 프라이빗 IPv4 주소 |
| 경로 | 인터넷을 통한 경로 | Azure 백본 직접 경로 |
| 보안 | 공용 인터넷 노출 | VNet으로 제한 |
| 비용 | - | 추가 비용 없음 |

### 서비스 엔드포인트 vs 프라이빗 엔드포인트

| 기능 | 서비스 엔드포인트 | 프라이빗 엔드포인트 |
|------|-------------------|---------------------|
| 연결 방식 | Azure 백본 최적화 경로 | VNet 내 NIC 배포 |
| IP 주소 | 공용 IP (프라이빗 원본) | 프라이빗 IP |
| 격리 수준 | 서브넷 수준 | 리소스 수준 |
| 온프레미스 접근 | 공용 IP 필요 | VPN/ExpressRoute 직접 접근 |
| 비용 | 무료 | 시간당 + 데이터 전송 요금 |

## Azure 가속 네트워킹 (Accelerated Networking)

SR-IOV 기술을 활용하여 VM의 네트워크 성능을 극적으로 향상시키는 기능입니다.

| 구분 | 일반 네트워킹 | 가속 네트워킹 |
|------|--------------|--------------|
| 핵심 처리 주체 | CPU (호스트 가상 스위치) | 물리적 NIC (하드웨어) |
| 데이터 경로 | VM → Hypervisor → V-Switch → NIC | VM → VF → NIC (직통) |
| 지연시간 | 상대적으로 높음 | 매우 낮음 |
| CPU 사용량 | 호스트 CPU 소모 | 부하 거의 없음 |
| 최대 성능 | 수 Gbps | 30~100+ Gbps |
| 비용 | - | **무료** |

### 활성화 조건
- VM이 중지/할당 취소 상태에서만 활성화 가능
- 2개 이상의 vCPU를 가진 대부분의 범용 인스턴스 지원
- 통신하는 모든 VM에서 활성화해야 최대 이점

## VNet 모범 사례

### Well-Architected Framework 5원칙

| 원칙 | 주요 권장사항 |
|------|-------------|
| 신뢰성 | 가용성 영역 활용, 중복 연결 구성 |
| 보안 | 네트워크 분할, Zero Trust 모델 적용 |
| 비용 최적화 | 허브-스포크 토폴로지, 데이터 전송 최소화 |
| 운영 우수성 | IaC 사용, 포괄적 모니터링 |
| 성능 효율성 | 가속화된 네트워킹, 적절한 리소스 선택 |

### VNet 비용 최적화 체크리스트

- ✅ VNet 자체는 무료 → 피어링, 데이터 전송, 게이트웨이 비용에 집중
- ✅ 허브-스포크 토폴로지 구현으로 피어링 복잡도 감소
- ✅ 동일 리전 내 워크로드 배치로 글로벌 피어링 비용 회피
- ✅ 게이트웨이 전송 활용으로 VPN Gateway 공유
- ✅ Private Link로 PaaS 서비스 연결 (피어링 대체)
- ✅ NSG/방화벽으로 불필요한 트래픽 조기 차단
- ✅ NAT Gateway로 아웃바운드 연결 통합

## NVA (네트워크 가상 어플라이언스) 라우팅

### NVA를 사용하는 이유

- **고급 보안**: 침입 방지(IPS), 패킷 심층 분석(DPI)
- **중앙 집중 관리**: 모든 트래픽을 한곳으로 모아 검사
- **하이브리드 연결**: 온프레미스와 클라우드 간 정교한 트래픽 제어

### 핵심 메커니즘: UDR과 IP Forwarding

NVA가 정상 작동하려면 두 가지 설정이 반드시 필요합니다:

1. **UDR**: "인터넷으로 가려면 NVA(10.0.0.4)를 거쳐서 가라"는 이정표
2. **IP Forwarding**: Azure VM은 기본적으로 자기 주소가 아닌 패킷을 버리므로, NVA의 NIC에서 IP Forwarding을 활성화해야 합니다

### 실무 주의사항

**비대칭 라우팅**: 나갈 때는 NVA를 거쳤는데 들어올 때 NVA를 안 거치면 방화벽이 세션을 끊어버립니다. UDR을 양방향으로 적용하거나 NVA에서 SNAT를 수행해야 합니다.

**고가용성**: Azure Load Balancer(Standard)를 NVA 앞에 배치하여 HA Ports 규칙을 사용하거나, Azure Route Server를 연동하여 동적 라우팅을 구성합니다.

### NVA 라우팅 구성 예시

```
[Web Subnet] → UDR: 0.0.0.0/0 → NVA(10.0.0.4)
                                      ↓
                              [패킷 검사/필터링]
                                      ↓
                              [인터넷 또는 다른 서브넷]
```

```json
{
  "name": "Force-Internet-Through-NVA",
  "addressPrefix": "0.0.0.0/0",
  "nextHopType": "VirtualAppliance",
  "nextHopIpAddress": "10.0.0.4"
}
```

## 참고 자료

- [Azure VNet 개념 설계 가이드](https://learn.microsoft.com/azure/virtual-network/)
- [NSG 작동 방식](https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview)
- [Azure 가속 네트워킹 개요](https://learn.microsoft.com/azure/virtual-network/accelerated-networking-overview)
- [서비스 엔드포인트 공식 문서](https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview)
