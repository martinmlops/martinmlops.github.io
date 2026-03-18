---
title: "네트워크 기초 - OSI 7계층과 TCP/IP"
date: 2026-03-18 11:00:00 +0900
categories: [Network, 네트워크 기초]
tags: [network, osi, tcp-ip, protocol, fundamentals]
description: "네트워크의 기본이 되는 OSI 7계층 모델과 TCP/IP 프로토콜 스택을 비교하며 각 계층의 역할을 정리합니다."
image:
  path: /assets/images/network/network-fundamentals.png
  alt: "OSI 7계층 모델"
math: false
mermaid: false
pin: false
---

## 개요

네트워크를 이해하기 위한 첫 번째 단계는 **OSI 7계층 모델**과 **TCP/IP 프로토콜 스택**을 이해하는 것입니다. 이 두 모델은 네트워크 통신이 어떻게 이루어지는지를 계층적으로 설명합니다.

## OSI 7계층 모델

OSI(Open Systems Interconnection) 모델은 네트워크 통신을 7개의 계층으로 나누어 설명합니다.

| 계층 | 이름 | 역할 | 프로토콜/장비 | PDU |
|:----:|------|------|-------------|-----|
| 7 | 응용 (Application) | 사용자 인터페이스 제공 | HTTP, FTP, SMTP, DNS | 데이터 |
| 6 | 표현 (Presentation) | 데이터 형식 변환, 암호화 | SSL/TLS, JPEG, ASCII | 데이터 |
| 5 | 세션 (Session) | 연결 설정, 유지, 종료 | NetBIOS, RPC | 데이터 |
| 4 | 전송 (Transport) | 종단 간 신뢰성 있는 전송 | TCP, UDP | 세그먼트 |
| 3 | 네트워크 (Network) | 논리적 주소 지정, 라우팅 | IP, ICMP, ARP | 패킷 |
| 2 | 데이터 링크 (Data Link) | 물리적 주소 지정, 프레이밍 | Ethernet, Wi-Fi | 프레임 |
| 1 | 물리 (Physical) | 비트 전송, 전기 신호 | 케이블, 허브, 리피터 | 비트 |

## OSI 모델 vs TCP/IP 모델

| OSI 7계층 | TCP/IP 4계층 | 주요 프로토콜 |
|-----------|-------------|-------------|
| 응용 (7) | 응용 (Application) | HTTP, DNS, FTP, SSH |
| 표현 (6) | 응용 (Application) | SSL/TLS, MIME |
| 세션 (5) | 응용 (Application) | - |
| 전송 (4) | 전송 (Transport) | TCP, UDP |
| 네트워크 (3) | 인터넷 (Internet) | IP, ICMP, ARP |
| 데이터 링크 (2) | 네트워크 접근 (Network Access) | Ethernet, Wi-Fi |
| 물리 (1) | 네트워크 접근 (Network Access) | - |

## TCP vs UDP

### TCP (Transmission Control Protocol)

**연결 지향적** 프로토콜로, 데이터의 신뢰성 있는 전송을 보장합니다.

TCP 3-Way Handshake:

```
클라이언트                    서버
    |                          |
    |--- SYN (seq=100) -----→ |
    |                          |
    |←-- SYN-ACK ------------ |
    |    (seq=300, ack=101)    |
    |                          |
    |--- ACK (ack=301) -----→ |
    |                          |
    |    연결 수립 완료          |
```

### UDP (User Datagram Protocol)

**비연결형** 프로토콜로, 빠른 전송이 필요한 경우에 사용합니다.

| 특성 | TCP | UDP |
|------|-----|-----|
| 연결 방식 | 연결 지향 | 비연결형 |
| 신뢰성 | 보장 (재전송) | 미보장 |
| 순서 보장 | 보장 | 미보장 |
| 속도 | 상대적으로 느림 | 빠름 |
| 헤더 크기 | 20바이트 | 8바이트 |
| 사용 사례 | 웹, 이메일, 파일 전송 | DNS, 스트리밍, 게임 |

## IP 주소 체계

### IPv4 주소 클래스

| 클래스 | 범위 | 기본 서브넷 마스크 | 네트워크/호스트 비트 | 용도 |
|--------|------|-------------------|-------------------|------|
| A | 1.0.0.0 ~ 126.255.255.255 | 255.0.0.0 (/8) | 8/24 | 대규모 네트워크 |
| B | 128.0.0.0 ~ 191.255.255.255 | 255.255.0.0 (/16) | 16/16 | 중규모 네트워크 |
| C | 192.0.0.0 ~ 223.255.255.255 | 255.255.255.0 (/24) | 24/8 | 소규모 네트워크 |

### 사설 IP 주소 대역

| 클래스 | 사설 IP 범위 | CIDR 표기 |
|--------|-------------|-----------|
| A | 10.0.0.0 ~ 10.255.255.255 | 10.0.0.0/8 |
| B | 172.16.0.0 ~ 172.31.255.255 | 172.16.0.0/12 |
| C | 192.168.0.0 ~ 192.168.255.255 | 192.168.0.0/16 |

## 서브넷팅 예시

`192.168.1.0/24` 네트워크를 4개의 서브넷으로 분할하는 경우:

```
원본 네트워크: 192.168.1.0/24 (256개 IP)

서브넷 분할 (/26 = 64개 IP씩):
┌─────────────────────────────────────────────────┐
│ 서브넷 1: 192.168.1.0/26   (호스트: .1 ~ .62)   │
│ 서브넷 2: 192.168.1.64/26  (호스트: .65 ~ .126)  │
│ 서브넷 3: 192.168.1.128/26 (호스트: .129 ~ .190) │
│ 서브넷 4: 192.168.1.192/26 (호스트: .193 ~ .254) │
└─────────────────────────────────────────────────┘
각 서브넷: 네트워크 주소 1개 + 호스트 62개 + 브로드캐스트 1개
```

## 주요 네트워크 명령어

```bash
# IP 설정 확인 (Linux)
ip addr show

# 연결 테스트
ping -c 4 8.8.8.8

# 경로 추적
traceroute google.com

# DNS 조회
nslookup example.com
dig example.com

# 포트 상태 확인
ss -tulnp
netstat -an | grep LISTEN

# ARP 테이블 확인
arp -a
```

## 클라우드 네트워킹과의 연결

OSI 모델의 이해는 클라우드 네트워킹을 학습하는 데 필수적입니다.

- **L3 (네트워크)** → VNet, Subnet, Route Table, IP 주소
- **L4 (전송)** → NSG(Network Security Group), Load Balancer
- **L7 (응용)** → Application Gateway, WAF, Front Door

> **팁:** 클라우드 네트워크 문제를 트러블슈팅할 때, OSI 계층을 아래에서 위로 순서대로 점검하면 효율적입니다.
{: .prompt-tip }

## 참고 자료

- [Cisco - OSI Model](https://www.cisco.com/c/en/us/products/ios-nx-os-software/)
- [RFC 791 - Internet Protocol](https://datatracker.ietf.org/doc/html/rfc791)
- [Azure Virtual Network 공식 문서](https://learn.microsoft.com/ko-kr/azure/virtual-network/)
