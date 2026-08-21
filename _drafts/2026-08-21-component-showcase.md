---
title: "컴포넌트 쇼케이스 (초안 · 실제 발행 안 됨)"
date: 2026-08-21 09:00:00 +0900
categories:
  - AI
tags:
  - components
  - design-system
excerpt: "docs/components.md 가이드에 나오는 컴포넌트를 전부 한 번씩 써 본 살아있는 참조 글. bundle exec jekyll build --drafts 로만 렌더된다."
---

이 글은 발행용이 아니라 `docs/components.md` 가이드의 각 스니펫이 실제로
어떻게 렌더되는지 확인하기 위한 초안이다. `_drafts/`에 있어서 평소 빌드에는
포함되지 않고, `bundle exec jekyll build --drafts`로만 나온다.

## 콜아웃

<div class="callout" markdown="1">

성능 테스트는 프로덕션과 동일한 인스턴스 타입에서 진행해야 신뢰할 수 있다.
개발 환경 결과만 보고 용량을 산정하면 나중에 크게 어긋난다.

</div>

## 카드 그리드

<div class="card-grid" markdown="1">
<div class="card" markdown="1">

**서버리스**

Lambda + API Gateway로 인프라 관리 부담을 없앤다.

</div>
<div class="card" markdown="1">

**IaC**

Terraform으로 환경을 코드로 재현 가능하게 만든다.

</div>
</div>

<p class="kicker"><span class="kicker-label">AGENDA</span> 오늘 이야기할 두 가지</p>

## 번호 카드 그리드

<div class="card-grid card-grid--3" markdown="1">
<div class="card" markdown="1">
<span class="card-num">1</span>

PART ONE
{: .card-kicker}

**AI-DLC 개발 방법론**

- AI-DLC란?
- 고객 사례 소개
- 느낀점과 한계
{: .card-list}

</div>
<div class="card" markdown="1">
<span class="card-num">2</span>

PART TWO
{: .card-kicker}

**GS네오텍에서의 1년**

- 7개월, 그리고 다시 1년
- 보람과 성장
{: .card-list}

</div>
<div class="card" markdown="1">
<span class="card-num">3</span>

PART THREE
{: .card-kicker}

**마무리**

- 배운 점
- 다음 계획
{: .card-list}

</div>
</div>

## 칩

<div class="chips">
<span class="chip">AWS Serverless</span>
<span class="chip">us-east-1</span>
<span class="chip">Terraform IaC</span>
</div>

## 비교

<div class="compare" markdown="1">
<div class="compare-good" markdown="1">

**그린필드**

- 처음부터 서버리스로 설계
- 팀이 신기술에 열려 있음

</div>
<div class="compare-bad" markdown="1">

**브라운필드**

- 기존 EC2 워크로드와 강결합
- 마이그레이션 리스크가 큼

</div>
</div>

## 고스트 넘버 섹션

<div class="ghost-block" data-n="01" markdown="1">

## AI-DLC 개발 방법론

아성다이소 대체상품 추천 서비스, AI 주도 개발 라이프사이클로 진행했다.

<div class="chips">
<span class="chip">리테일 · 생활용품 유통</span>
<span class="chip">PoC / MVP · 3일</span>
</div>

</div>

여기까지가 `docs/components.md`에 있는 컴포넌트 전부다.
