# 컴포넌트 가이드

글을 쓸 때 펼쳐놓고 복사-붙여넣기 하는 참조 문서. `docs/`는 `_config.yml`의
`exclude`에 있어서 빌드에 안 들어간다(사이트에 안 뜬다) — 걱정 없이 여기에
적어도 된다.

모든 컴포넌트는 순수 HTML/kramdown이다. Liquid도, include도, front matter
플래그도 필요 없다. 그냥 본문에 타이핑하면 된다.

**미리 보기**: 초안(`_drafts/`)은 평소 빌드에서 빠진다. 아래처럼 `--drafts`
플래그를 붙여야 렌더된다.

```bash
bundle exec jekyll build --drafts
# 또는 로컬 서버로 보려면
bundle exec jekyll serve --drafts
```

모든 컴포넌트가 한 번씩 들어간 예시가 `_drafts/2026-08-21-component-showcase.md`에
있다. 뭘 쓸지 감이 안 잡히면 그 글을 먼저 열어 보자.

---

## 어떤 걸 써야 하나

| 하려는 것 | 컴포넌트 |
|---|---|
| 본문 중간에 주의사항·팁 한 단락 강조 | [콜아웃](#콜아웃-callout) |
| 개념 2~4개를 나란히 비교 없이 나열 | [카드 그리드](#카드-그리드-card-grid--card) |
| "1부/2부"처럼 번호 붙은 갈래 3개를 카드로 | [번호 카드 그리드](#번호-카드-그리드-card-grid--card-num--card-kicker--card-list) |
| 스택·지역·키워드 같은 짧은 태그 나열 | [칩](#칩-chips--chip) |
| "이렇게 하면 좋다 / 이렇게 하면 나쁘다" 대조 | [비교](#비교-compare--compare-good--compare-bad) |
| 섹션 시작에 파란 라벨 + 부제 한 줄 | [모노 eyebrow](#모노-eyebrow-kicker--kicker-label) |
| "PART ONE"처럼 큰 구간을 여는 전면 슬랩 | [고스트 넘버 섹션](#고스트-넘버-섹션-ghost-block) |

---

## 콜아웃 (`.callout`)

**언제**: 본문 흐름과 분리해서 짧은 팁·주의사항 한두 문단을 강조하고 싶을 때.
톤이 강한 경고(`.notice--warning` 등, kramdown IAL로 붙이는 기존 방식)와는
다르다 — `.callout`은 중립적인 옅은 박스다.

```html
<div class="callout" markdown="1">
성능 테스트는 프로덕션과 동일한 인스턴스 타입에서 진행해야 신뢰할 수 있다.
개발 환경 결과만 보고 용량을 산정하면 나중에 크게 어긋난다.
</div>
```

- 안에 문단이 여러 개면 그냥 빈 줄로 나누면 된다.
- `markdown="1"`을 꼭 붙인다 — 안 붙이면 안쪽 텍스트가 그대로(가공 없이) 나온다.

---

## 카드 그리드 (`.card-grid` / `.card`)

**언제**: 비교가 아니라 "이런 것들이 있다" 나열. 2~4개 항목을 훑어보게 할 때.

```html
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
```

- 각 카드의 **첫 문단**이 `**굵게**`면 카드 제목처럼 커진다(`p:first-child strong`
  규칙). 카드 안에서 제목 문단을 맨 위에 두는 게 핵심이다.
- 강조하고 싶은 카드 하나만 반전시키려면 `class="card dk"`를 준다(어두운 카드,
  라이트/다크 모두에서 배경이 자동으로 반전된다).
- 기본은 2열이고, 768px 이하에서 1열로 접힌다.

---

## 번호 카드 그리드 (`.card-grid.card-grid--3` + `.card-num` / `.card-kicker` / `.card-list`)

**언제**: "1부 / 2부 / 3부"처럼 번호가 붙은 갈래를 3개짜리 카드로 보여줄 때.
목차·아젠다 섹션에 어울린다.

```html
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
```

- `card-grid`에 `card-grid--3` 클래스를 **추가로** 붙여야 3열이 된다.
  (`card-grid` 하나만 있으면 2열이다.) 768px 이하에서는 이 변형도 1열로 접힌다.
- `<span class="card-num">1</span>`은 카드 맨 위, 마크다운으로 안 감싸도 되는
  순수 인라인 HTML 한 줄이다.
- `PART ONE` 같은 모노 라벨은 **문단을 쓰고 바로 다음 줄에 IAL을 붙인다**
  (`{: .card-kicker}`) — 빈 줄 없이. 이러면 별도 태그 없이 그 문단에 클래스가
  붙는다.
- 목록의 A/B/C는 **직접 타이핑하지 않는다.** 평범한 `- 항목` 목록을 쓰고
  바로 아래 줄에 `{: .card-list}`만 붙이면 CSS가 A, B, C…를 자동으로 매긴다.
  목록이 늘어나거나 순서가 바뀌어도 다시 손댈 게 없다.
- `card-kicker` 문단 바로 다음에 오는 `**제목**` 문단이 카드 제목으로
  커진다(`.card-kicker + p strong`). 즉 순서가 `card-num → card-kicker →
  제목 문단 → card-list` 이어야 한다.

### 카드 안에서 흔한 실수

`<div class="card">` 열고 바로 다음 줄에 `<span class="card-num">1</span>`을
쓴 뒤, **빈 줄 없이** `PART ONE`을 쓰면 kramdown이 둘을 한 문단으로 묶어버려
`card-kicker` IAL이 원하는 자리에 안 붙는다. `card-num` span 다음에는 반드시
빈 줄을 하나 넣고 `PART ONE`을 새 문단으로 시작하자.

---

## 칩 (`.chips` / `.chip`)

**언제**: 스택·지역·키워드처럼 짧은 라벨을 한 줄로 나열할 때. 태그처럼 보이되
글의 태그(`post-tags`)와는 별개다.

```html
<div class="chips">
<span class="chip">AWS Serverless</span>
<span class="chip">us-east-1</span>
<span class="chip">Terraform IaC</span>
</div>
```

- 줄이 좁아지면 자동으로 다음 줄로 넘어간다(`flex-wrap`).
- 순수 인라인 요소라 `markdown="1"`이 필요 없다. 라벨 안에 마크다운 문법을
  쓸 일이 없기 때문이다.

---

## 비교 (`.compare` / `.compare-good` / `.compare-bad`)

**언제**: "이렇게 하면 좋다 vs 이렇게 하면 나쁘다"류 좌우 대조.

```html
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
```

- `compare-good`의 목록 항목 앞에는 초록 체크(✓), `compare-bad`는 회색 엑스(✕)가
  자동으로 붙는다. 목록 앞에 직접 기호를 타이핑하지 않는다.
- 바깥 `.compare` 뿐 아니라 **안쪽 `.compare-good`/`.compare-bad` div에도
  각각 `markdown="1"`**을 붙여야 한다 — 셋 다 HTML 블록이기 때문이다.

---

## 모노 eyebrow (`.kicker` / `.kicker-label`)

**언제**: 섹션을 열기 전에 "AGENDA" 같은 짧은 파란 모노 라벨과, 그 옆에 무슨
얘기인지 알려주는 옅은 보조 문구 한 줄.

```html
<p class="kicker"><span class="kicker-label">AGENDA</span> 오늘 이야기할 두 가지</p>

## 목차
```

- 한 줄짜리 순수 인라인 HTML이라 `markdown="1"`이 필요 없다.
- `##` 제목 바로 위에 붙이는 용도다. 제목과의 사이에 빈 줄을 둬도 되고 안
  둬도 된다 — `<p>`가 이미 블록이라 다음 줄의 `##`은 항상 새 블록으로
  파싱된다.
- 카드 안에서 쓰는 `.card-kicker`와는 다른 컴포넌트다. `.card-kicker`는 카드
  내부 전용(문단 IAL), `.kicker`는 섹션 전체 위에 독립적으로 쓴다.

---

## 고스트 넘버 섹션 (`.ghost-block`)

**언제**: "PART ONE" 같은 큰 구간을 여는 전면 슬랩. 배경이 반전되고
(라이트에서는 어두운 배경, 다크에서는 밝은 배경) 오른쪽 위에 큰 숫자가
흐리게 깔린다.

```html
<div class="ghost-block" data-n="01" markdown="1">

## AI-DLC 개발 방법론

아성다이소 대체상품 추천 서비스, AI 주도 개발 라이프사이클로 진행했다.

<div class="chips">
<span class="chip">리테일 · 생활용품 유통</span>
<span class="chip">PoC / MVP · 3일</span>
</div>

</div>
```

- `data-n="01"`이 배경에 흐리게 깔리는 숫자다. 두 자리든 세 글자든 그대로
  찍히니 "01", "PT.1" 처럼 원하는 문자열을 넣어도 된다.
- **`markdown="1"`이 없으면 안의 `##`과 문단이 그대로 텍스트로 나온다.**
  이 컴포넌트에서 가장 많이 걸리는 실수다.
- 안에서 `.chips`/`.chip`을 그대로 재사용할 수 있다 — 반전된 배경에 맞게
  톤이 자동으로 옅어지도록 이미 스코프돼 있다.
- 이미지·표처럼 넓은 요소를 넣지 않는다. 슬랩은 텍스트 전용으로 튜닝돼 있다.

---

## kramdown에서 실제로 물리는 함정 3가지

1. **HTML과 마크다운 사이의 빈 줄이 파싱을 바꾼다.**
   ```html
   <div class="callout">
   **이 굵은 글씨는 그대로 `**이 굵은 글씨는**`로 보인다.**
   </div>
   ```
   빈 줄 없이 HTML 태그 바로 다음에 텍스트를 쓰면 kramdown이 안쪽을 "raw
   HTML 콘텐츠"로 취급해서 마크다운 문법을 해석하지 않는다. **여는 태그
   다음에 빈 줄을 하나 넣어야** 안쪽이 마크다운으로 파싱된다.
   ```html
   <div class="callout" markdown="1">

   **이제는 진짜로 굵게 나온다.**

   </div>
   ```
   그래서 이 문서의 모든 예시가 여는 태그 다음에 빈 줄을 넣는다 — 습관으로
   만들어두면 편하다.

2. **`markdown="1"`은 "이 HTML 블록 안에서도 마크다운을 써라"는 뜻이다.**
   `markdown="1"`이 없는 HTML 블록은 kramdown이 통째로 raw HTML로 그대로
   출력한다. 안에서 `**`, `-`, `##` 같은 마크다운 문법을 쓸 계획이면 그
   블록의 여는 태그에 반드시 붙여야 한다. (`.chips`/`.card-num`/`.kicker`처럼
   안에 순수 텍스트/인라인 태그만 있는 컴포넌트는 필요 없다 — 위 각 절의
   "필요 없다" 표시를 참고.)

3. **이미지 다음 줄에 빈 줄 없이 이탤릭 캡션을 쓰면 한 문단으로 묶인다.**
   ```markdown
   ![다이어그램](/assets/images/foo.png)
   *그림 1. 아키텍처 개요*
   ```
   이 둘 사이에 빈 줄이 없으면 kramdown이 `<p><img>…<em>…</em></p>` 하나로
   묶는다. 이 블로그의 `_post.scss`가 이 패턴을 감지해서 이미지를 위, 캡션을
   아래로 세로 배치해 주므로 시각적으로는 깨지지 않는다 — 하지만 의도한
   동작이라는 걸 알고 쓰자. **캡션 없이 이미지만 쓸 때, 그리고 캡션이
   이미지와 분리된 별도 문단이길 원할 때는 반드시 빈 줄을 넣는다.**
