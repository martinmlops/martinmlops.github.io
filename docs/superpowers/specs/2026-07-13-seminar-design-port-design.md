# 세미나 디자인 시스템 블로그 이식 — 디자인 스펙

- 날짜: 2026-07-13
- 상태: 승인됨
- 대상: martinmlops.github.io (Jekyll + minimal-mistakes 4.26.2, air 스킨)
- 소스: `내부세미나_AI-DLC_아성_다이소_조석영.html`의 디자인 시스템 (git 미추적, 참조용)

## 목표

내부 세미나 HTML의 애플 스타일 디자인 언어(토큰·타이포·컴포넌트)를 블로그 전역에 이식한다.
글 작성은 지금처럼 마크다운으로 하되, 화면 완성도를 세미나 수준으로 끌어올린다.

## 확정된 요구사항

1. **전체 이식**: 전역 룩앤필 교체(소라색 `#B0BEF5` → 애플 블루) + 재사용 컴포넌트 추가
2. **기존 글 무수정**: 전역 스타일은 기존 30개 포스트에 자동 적용. 컴포넌트는 새 글부터 opt-in
3. **한글 폰트**: Pretendard Variable 웹폰트(jsdelivr CDN), SF Pro 스택 폴백
4. **다크모드**: 기존 🌙 토글(`html.dark-mode` 클래스) 유지, 토큰 재정의로 연동

## 1. 디자인 토큰

세미나 HTML에서 추출. RGB 삼중값 형태를 유지해 `rgb(var(--accent) / .5)` 알파 조합 지원.

| 토큰 | 라이트 (`:root`) | 다크 (`html.dark-mode`) | 용도 |
|---|---|---|---|
| `--bg` | `255 255 255` | `0 0 0` | 배경 |
| `--fg` | `29 29 31` | `245 245 247` | 본문 텍스트 |
| `--muted` | `122 122 122` | `134 134 139` | 보조 텍스트 |
| `--subtle` | `245 245 247` | `28 28 30` | 콜아웃·코드 배경 |
| `--line` | `224 224 224` | `52 52 54` | 테두리·구분선 |
| `--accent` | `0 102 204` | `41 151 255` | 링크·포인트 |

폰트 토큰:

```css
--font-sans: "Pretendard Variable", Pretendard, "SF Pro Text", "SF Pro Display",
             -apple-system, BlinkMacSystemFont, "Helvetica Neue",
             "Apple SD Gothic Neo", system-ui, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

- Pretendard 로드: `_includes/head/custom.html`에 jsdelivr 가변 폰트 CSS `<link>` 1줄 추가
- 세미나 원본은 `[data-theme=dark]` 셀렉터를 쓰지만, 블로그는 기존 토글이 쓰는 `html.dark-mode`로 매핑한다

## 2. 파일 아키텍처

```
assets/css/main.scss          # front matter + $primary-color/$max-width 변수 + 임포트 순서만
_sass/custom/_tokens.scss     # 위 토큰 (라이트/다크)
_sass/custom/_base.scss       # 본문 타이포·링크·표·인용구·코드블록 전역 오버라이드
_sass/custom/_components.scss # callout / card / chip / compare
_sass/custom/_layout.scss     # 기존 801줄 커스텀 이관 (사이드바 토글·프로필·TOC 등)
```

- 임포트 순서: skins/air → minimal-mistakes → custom/tokens → base → components → layout
- SCSS 컴파일 변수 `$primary-color: #0066cc`로 교체 (테마 내부 요소 일관성)
- `_layout.scss` 이관 시 하드코딩된 `#B0BEF5` 및 파생색은 전부 토큰 참조로 교체. 규칙 삭제 없음
- remote_theme 환경에서 사이트의 `_sass/`가 로드 패스에 병합되므로 `@import "custom/tokens";` 형식 사용

## 3. 전역 베이스 (`_base.scss`)

기존 글이 본문 수정 없이 자동으로 입는 스타일:

- **본문**: `--font-sans`, 17px, line-height 1.7, `rgb(var(--fg))`
- **링크**: `rgb(var(--accent))`, 밑줄 최소화
- **표**: 세미나 톤 — 얇은 `--line` 테두리, 헤더 `--subtle` 배경, 셀 패딩 확대
- **인용구(blockquote)**: 세미나 콜아웃 톤(subtle 배경, 10px 라운드, `--line` 테두리)으로 재스타일
  → 기존 글의 `> 💡` / `> ⚠️` 팁 상자가 자동 업그레이드되는 핵심 지점
- **코드블록·인라인 코드**: `--font-mono`, `--subtle` 배경, 라이트/다크 연동
- **헤딩**: 자간 -0.01em 수준의 타이트한 애플 톤, h2 하단 `--line` 구분선

## 4. 컴포넌트 (`_components.scss`)

kramdown `markdown="1"` 속성으로 HTML 블록 안 마크다운 처리. 4종:

### 4.1 콜아웃 `.callout`
flex(아이콘+텍스트), `--subtle` 배경, 10px 라운드, `--line`/.6 테두리.

```html
<div class="callout" markdown="1">
💡 **팁 제목.** 본문 내용.
</div>
```

### 4.2 카드 `.card` + `.card-grid`
`--line` 테두리, 12px 라운드, 24px 패딩. `.card-grid`는 2열 그리드(모바일 768px 이하 1열).
강조용 반전 카드 `.card.dk`(fg 배경/bg 글자) 포함. 카드 내부 첫 `<strong>`을 제목 스타일로 처리.

### 4.3 칩 `.chip` + `.chips`
pill 형태(100px 라운드), 11px, `--muted` 색, `--line` 테두리. `.chips`는 flex-wrap 컨테이너.

### 4.4 비교 `.compare`
2열 대비 블록(모바일 세로 스택). 좌측 `.compare-good`(accent 테두리, ✓ 목록),
우측 `.compare-bad`(muted 테두리, ✕ 목록). 세미나의 그린필드/브라운필드 슬라이드 레이아웃 계승.

## 5. 다크모드 · mermaid 연동

- `theme-toggle.js`의 클래스 토글 로직은 변경 없음
- `theme-toggle.js`와 `mermaid-init.js`에 하드코딩된 mermaid 팔레트(소라색 계열)를
  악센트 블루 팔레트(라이트 `#0066cc` 계열 / 다크 `#2997ff` 계열)로 교체
- 코드 하이라이트(rouge) 배경을 `--subtle` 토큰에 연동

## 6. 검증 계획

1. **로컬**: `bundle exec jekyll serve` — 홈 / 인사이트형 포스트(표·mermaid·코드·TOC) / 학습정리형 포스트를 라이트·다크·모바일 폭에서 확인
2. **컴포넌트 쇼케이스**: 4종 컴포넌트를 모두 쓴 임시 검증 포스트로 렌더링 확인 후 삭제(커밋 미포함)
3. **배포**: push → GitHub Actions 빌드 성공 확인 → 라이브에서 CSS 적용·다크 토글·mermaid 색 확인

## 부수 변경

- `_config.yml` `exclude:`에 `docs` 추가 — 이 스펙 문서가 블로그 페이지로 배포되지 않도록 함

## 범위 제외 (YAGNI)

- 기존 포스트 본문 리라이트 (컴포넌트 소급 적용 안 함)
- 세미나의 슬라이드 네비게이션·아코디언 등 프레젠테이션 전용 인터랙션
- 레이아웃 구조 변경 (사이드바·마스트헤드 배치는 현행 유지)
