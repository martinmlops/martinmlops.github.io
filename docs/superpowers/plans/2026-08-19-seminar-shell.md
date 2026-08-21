# 세미나 셸 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** minimal-mistakes의 레이아웃·CSS 의존을 제거하고, 세미나 HTML의 셸(52px sticky 헤더 + CONTENTS 레일 + 2단 본문)과 색상 체계를 블로그 전 페이지에 적용한다. 검색은 한국어에서 동작하도록 교체한다.

**Architecture:** 자체 레이아웃 4종(`default`/`post`/`page`/`home`)을 작성해 MM 레이아웃을 대체한다. 1~3단계는 MM과 공존하고(우리 레이아웃이 MM 클래스를 안 쓰므로 무해), 4단계에서 `@import "minimal-mistakes"`를, 6단계에서 `remote_theme`을 걷어낸다. 검색은 Ruby 제너레이터가 만든 JSON 인덱스를 순수 함수가 부분문자열 매칭한다.

**Tech Stack:** Jekyll 4.3, SCSS(CSS 커스텀 프로퍼티 토큰), 바닐라 JS(ES 모듈), Ruby 제너레이터(Nokogiri), jest(소스 단언)·vitest(순수 함수), claude-in-chrome(시각 확인)

**Spec:** [`docs/superpowers/specs/2026-08-19-seminar-shell-design.md`](../specs/2026-08-19-seminar-shell-design.md)

**Branch:** `redesign/seminar-shell` (이미 생성됨, 스펙 커밋 `9d6c802`까지 진행)

## Global Constraints

- **색은 `_sass/custom/_tokens.scss`에서만 정의한다.** 다른 SCSS는 `rgb(var(--…))` 로만 참조. 농담은 새 색이 아니라 알파 합성(`rgb(var(--accent) / .08)`). 예외는 rouge 팔레트 블록뿐이며 주석으로 예외임을 남긴다.
- **세미나 블루가 유일한 강조색이다.** 라이트 `--accent: 0 102 204`, 다크 `--accent: 41 151 255`.
- **기존 포스트 31편의 본문은 수정하지 않는다.**
- **`main`에 푸시하지 않는다.** 6단계 완료 후 사용자 승인을 받아 병합한다.
- 커밋 메시지는 한국어, 기존 컨벤션(`feat:`/`fix:`/`refactor:`/`docs:`)을 따른다.
- 각 태스크 종료 시 `bundle exec jekyll build`가 에러 없이 통과해야 한다.

## 사전 확인된 사실 (조사 완료, 재조사 불필요)

| 항목 | 값 |
|---|---|
| 포스트 수 | 31편, **전부 front matter에 `layout` 미기재** (`_config` defaults를 탐) |
| `_pages` | 20개 = `layout: single` 18 + `layout: tags` 1(`tags.md`) + 미기재 1(`about.md`) |
| `_config.yml` defaults | 92행 `defaults:` / 97행 posts `layout: single` / 110행 `_pages` `layout: single` |
| 커스텀 SCSS | `_sass/custom/{_tokens,_base,_components,_layout}.scss` (1,029줄) |
| 하드코딩 색 | 34종 (파랑 계열만 7종) |
| 기존 JS | `mermaid-init`, `permalink-fix`, `sidebar-toggle`, `theme-toggle`, `toc-active-fix` |
| giscus | `repo_id`·`category_id`가 placeholder → **댓글은 실제로 동작하지 않음** |
| GA | `tracking_id`가 placeholder |
| 커스텀 플러그인 | **사용 가능** — 워크플로가 `bundle exec jekyll build`를 직접 실행 |
| 빌드 시간 | 약 110초 (remote_theme fetch 포함) |

## File Structure

**생성**

| 파일 | 책임 |
|---|---|
| `_layouts/default.html` | 셸 골격 — head, 헤더, 레일, main, 푸터 |
| `_layouts/post.html` | 포스트 — eyebrow·타이틀·메타·본문 |
| `_layouts/page.html` | 일반 페이지 — 타이틀·본문 |
| `_layouts/home.html` | 홈 — 페이지네이션 목록 |
| `_includes/site-header.html` | 52px sticky 헤더 |
| `_includes/contents-rail.html` | CONTENTS 레일 (목차 자리 + 사이트 내비) |
| `_includes/search-overlay.html` | 검색 오버레이 마크업 |
| `_data/categories.yml` | 카테고리 단일 출처 (레일·푸터 공용) |
| `_sass/custom/_shell.scss` | 헤더·레일·레이아웃 그리드·푸터 |
| `_sass/custom/_post.scss` | eyebrow·타이틀·메타·포스트 목록 카드 |
| `_sass/custom/_search.scss` | 검색 오버레이 |
| `assets/js/contents-rail.js` | 목차 생성 + 스크롤 추적 + 모바일 드로어 |
| `assets/js/search-core.js` | **순수 함수** — normalize / search / makeSnippet |
| `assets/js/search-ui.js` | 오버레이 제어, 인덱스 지연 로드 |
| `_plugins/search_index.rb` | `search-index.json` 생성 |
| `__tests__/shell.test.js` | 셸·레이아웃·색상 소스 단언 |
| `__tests__/search-core.test.ts` | 검색 순수 함수 단위 테스트 |

**수정**

| 파일 | 변경 |
|---|---|
| `_config.yml` | defaults 레이아웃명, `after_footer_scripts`, 6단계에서 `remote_theme` 제거 |
| `_sass/custom/_tokens.scss` | 3-상태 테마, 상태색 토큰 추가 |
| `assets/css/main.scss` | 새 파티셜 임포트, 4단계에서 MM 임포트 제거 |
| `_includes/head/custom.html` | FOUC 방지 스크립트를 `data-theme`로 |
| `assets/js/theme-toggle.js` | 3-상태 + `window.blogTheme` 노출 |
| `assets/js/mermaid-init.js` | `isDark` 판정을 `window.blogTheme`로 |
| `_includes/footer.html` | `_data/categories.yml` 사용 |
| `__tests__/utils.js` | 헬퍼 추가 |
| `_pages/*.md` (19개) | `layout` 값 치환 |

**삭제** (4·6단계)

`_includes/masthead.html`, `_includes/sidebar.html`, `_includes/sidebar-custom.html`, `_includes/author-profile.html`, `_includes/author-profile-custom-links.html`, `assets/js/permalink-fix.js`, `assets/js/toc-active-fix.js`, `assets/js/sidebar-toggle.js`, `_sass/custom/_layout.scss`(내용을 `_shell`/`_post`로 이관 후)

---

## Task 1: 셸 + 포스트 레이아웃 + 3-상태 테마

**Files:**
- Create: `_layouts/default.html`, `_layouts/post.html`, `_includes/site-header.html`, `_includes/contents-rail.html`, `_data/categories.yml`, `_sass/custom/_shell.scss`, `_sass/custom/_post.scss`, `assets/js/contents-rail.js`, `__tests__/shell.test.js`
- Modify: `_sass/custom/_tokens.scss`, `assets/css/main.scss`, `_includes/head/custom.html`, `assets/js/theme-toggle.js`, `assets/js/mermaid-init.js`, `_config.yml:97`, `_config.yml` `after_footer_scripts`
- Test: `__tests__/shell.test.js`

**Interfaces:**
- Produces: `window.blogTheme.isDark() → boolean` (Task 1 이후 `mermaid-init.js`와 Task 5의 검색 UI가 사용)
- Produces: `.theme-toggle` 클래스를 가진 모든 버튼이 테마 토글로 동작 (헤더·레일 양쪽)
- Produces: `<main id="main" class="content">` — Task 5의 목차/검색이 이 컨테이너를 기준으로 동작
- Produces: `_data/categories.yml` 스키마 `[{title, url}]` — Task 2의 푸터와 레일이 공용

- [ ] **Step 1: 실패 테스트 작성**

`__tests__/shell.test.js` 생성:

```js
const fs = require('fs');
const path = require('path');
const { readYaml, readFileContent } = require('./utils');

const ROOT = path.resolve(__dirname, '..');

describe('셸 레이아웃', () => {
  test('default 레이아웃이 헤더·레일·main을 포함한다', () => {
    const html = readFileContent('_layouts/default.html');
    expect(html).toMatch(/include site-header\.html/);
    expect(html).toMatch(/include contents-rail\.html/);
    expect(html).toMatch(/id="main"/);
  });

  test('포스트 기본 레이아웃이 post이다', () => {
    const cfg = readYaml('_config.yml');
    const postsDefault = cfg.defaults.find(
      (d) => d.scope.type === 'posts' && d.scope.path === ''
    );
    expect(postsDefault.values.layout).toBe('post');
  });
});

describe('테마 토큰', () => {
  const tokens = () => readFileContent('_sass/custom/_tokens.scss');

  test('라이트 토큰을 :root에 정의한다', () => {
    expect(tokens()).toMatch(/:root\s*\{[^}]*--accent:\s*0 102 204/s);
  });

  test('OS 다크 선호를 지원한다', () => {
    expect(tokens()).toMatch(/@media \(prefers-color-scheme: dark\)/);
  });

  test('명시적 data-theme 오버라이드를 지원한다', () => {
    expect(tokens()).toMatch(/\[data-theme="dark"\]/);
    expect(tokens()).toMatch(/\[data-theme="light"\]/);
  });

  test('html.dark-mode 클래스 방식은 남아 있지 않다', () => {
    const files = ['_sass/custom/_tokens.scss', 'assets/js/theme-toggle.js',
                   'assets/js/mermaid-init.js', '_includes/head/custom.html'];
    files.forEach((f) => expect(readFileContent(f)).not.toMatch(/dark-mode/));
  });
});

describe('색상 규칙 (신규 파일)', () => {
  const NEW_SCSS = ['_sass/custom/_shell.scss', '_sass/custom/_post.scss'];

  test.each(NEW_SCSS)('%s 에 hex 리터럴이 없다', (f) => {
    const hex = (readFileContent(f).match(/#[0-9a-fA-F]{3,8}\b/g) || []);
    expect(hex).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/2026/03_Study/blog
npx jest __tests__/shell.test.js
```

Expected: FAIL — `ENOENT: _layouts/default.html`

- [ ] **Step 3: 토큰을 3-상태로 재작성**

`_sass/custom/_tokens.scss` 전체 교체:

```scss
/* ── 디자인 토큰 ────────────────────────────────────────
   이 파일이 색을 정의하는 유일한 곳이다.
   다른 SCSS는 rgb(var(--…)) 형태로만 색을 참조한다.
   농담이 필요하면 새 색을 만들지 말고 알파로 합성한다:
     rgb(var(--accent) / .08)
   예외는 rouge(코드 하이라이트) 팔레트뿐이다. */

:root {
  --bg: 255 255 255;
  --fg: 29 29 31;
  --muted: 122 122 122;
  --subtle: 245 245 247;
  --line: 224 224 224;
  --accent: 0 102 204;

  --ok: 52 199 89;
  --warn: 255 149 0;
  --danger: 255 59 48;

  --font-sans: "Pretendard Variable", Pretendard, -apple-system,
    BlinkMacSystemFont, "SF Pro Text", "Apple SD Gothic Neo", system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@mixin dark-tokens {
  --bg: 0 0 0;
  --fg: 245 245 247;
  --muted: 134 134 139;
  --subtle: 28 28 30;
  --line: 52 52 54;
  --accent: 41 151 255;

  --ok: 48 209 88;
  --warn: 255 159 10;
  --danger: 255 69 58;
}

/* 미선택(기본) = OS 설정을 따른다. 단 명시적 라이트는 이기지 못한다. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { @include dark-tokens; }
}

/* 명시적 다크는 항상 이긴다. */
:root[data-theme="dark"] { @include dark-tokens; }

/* 명시적 라이트는 :root 기본값을 그대로 쓴다 (선택자 존재 자체가 테스트 대상). */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

- [ ] **Step 4: FOUC 방지 스크립트를 `data-theme`로**

`_includes/head/custom.html`의 기존 `<script>` 블록(5~10행)을 교체:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") {
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 5: 테마 토글 재작성**

`assets/js/theme-toggle.js` 전체 교체:

```js
(function () {
  var root = document.documentElement;

  function systemPrefersDark() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return systemPrefersDark();
  }

  function apply(dark) {
    root.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch (e) {}
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { isDark: dark } })
    );
  }

  window.blogTheme = { isDark: isDark, apply: apply };

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll(".theme-toggle");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        apply(!isDark());
      });
    });
  });
})();
```

- [ ] **Step 6: mermaid 다크 판정을 공용 API로**

`assets/js/mermaid-init.js:15`의

```js
var isDark = document.documentElement.classList.contains("dark-mode");
```

를 다음으로 교체:

```js
var isDark = window.blogTheme ? window.blogTheme.isDark() : false;
```

- [ ] **Step 7: 카테고리 단일 출처 생성**

`_data/categories.yml`:

```yaml
- title: "Azure"
  url: /categories/azure/
- title: "AWS"
  url: /categories/aws/
- title: "AI"
  url: /categories/ai/
- title: "Terraform"
  url: /categories/terraform/
- title: "Tech Insights"
  url: /categories/tech-insights/
```

- [ ] **Step 8: 헤더 include 생성**

`_includes/site-header.html`:

```liquid
<header class="site-header">
  <a class="header-logo" href="{{ '/' | relative_url }}">
    {{ site.author.name }} · <b>{{ site.title }}</b>
  </a>
  <div class="header-right">
    <span class="header-meta">{{ site.title }} · {{ site.time | date: '%Y' }}</span>
    <button class="icon-btn rail-open" type="button" aria-label="목차 열기" aria-expanded="false">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="icon-btn theme-toggle" type="button" aria-label="테마 전환">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.4"/>
        <path d="M8 2.8v10.4A5.2 5.2 0 008 2.8z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</header>
```

- [ ] **Step 9: CONTENTS 레일 include 생성**

`_includes/contents-rail.html`:

```liquid
<aside class="rail" id="contents-rail">
  <div class="rail-label">Contents</div>

  <nav class="rail-toc" id="rail-toc" aria-label="목차" hidden></nav>

  <nav class="rail-nav" id="rail-nav" aria-label="카테고리">
    <div class="rail-part">Categories</div>
    <ul>
      {%- for c in site.data.categories -%}
      <li>
        <a href="{{ c.url | relative_url }}"{% if page.url contains c.url %} class="act"{% endif %}>
          <span class="n">{{ forloop.index | prepend: '0' | slice: -2, 2 }}</span>{{ c.title }}
        </a>
      </li>
      {%- endfor -%}
    </ul>
  </nav>

  <div class="rail-footer">
    <button class="icon-btn theme-toggle" type="button" aria-label="테마 전환">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.2" stroke="currentColor" stroke-width="1.4"/>
        <path d="M8 2.8v10.4A5.2 5.2 0 008 2.8z" fill="currentColor"/>
      </svg>
    </button>
    <span>Theme</span>
  </div>
</aside>
```

- [ ] **Step 10: default 레이아웃 생성**

`_layouts/default.html`:

```liquid
<!doctype html>
<html lang="{{ site.locale | default: 'ko-KR' }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {%- seo -%}
  {%- include head/custom.html -%}
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  {%- feed_meta -%}
</head>
<body>
  {%- include site-header.html -%}

  <div class="layout">
    {%- include contents-rail.html -%}
    <main class="content" id="main">
      {{ content }}
    </main>
  </div>

  <footer class="site-footer">
    {%- include footer.html -%}
  </footer>

  {%- for src in site.after_footer_scripts -%}
    <script src="{{ src | relative_url }}"></script>
  {%- endfor -%}
</body>
</html>
```

- [ ] **Step 11: post 레이아웃 생성**

`_layouts/post.html`:

```liquid
---
layout: default
---
<article class="post">
  <header class="post-head">
    {%- if page.categories.size > 0 -%}
    <div class="eyebrow">
      {%- for c in page.categories -%}
      <span class="ac">{{ forloop.index | prepend: '0' | slice: -2, 2 }}</span> {{ c | upcase }}{% unless forloop.last %} · {% endunless %}
      {%- endfor -%}
    </div>
    {%- endif -%}

    <h1 class="post-title">{{ page.title }}</h1>

    <div class="post-meta">
      <time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: '%Y.%m.%d' }}</time>
      {%- if page.last_modified_at -%}
      <span class="sep">·</span>개정 {{ page.last_modified_at | date: '%Y.%m.%d' }}
      {%- endif -%}
      {%- if page.read_time != false -%}
      <span class="sep">·</span>{{ content | number_of_words: 'auto' | divided_by: 500 | plus: 1 }}분
      {%- endif -%}
    </div>
  </header>

  <div class="post-body">
    {{ content }}
  </div>

  {%- if page.tags.size > 0 -%}
  <div class="post-tags chips">
    {%- for t in page.tags -%}<span class="chip">{{ t }}</span>{%- endfor -%}
  </div>
  {%- endif -%}
</article>
```

> **댓글 없음이 의도적이다.** `_config.yml`의 giscus `repo_id`·`category_id`가 placeholder라 현재도 동작하지 않는다. 실제 id를 채우기 전까지 마크업을 넣지 않는다.

- [ ] **Step 12: 셸 CSS 작성**

`_sass/custom/_shell.scss` — 세미나 원본 값을 그대로 옮긴다:

```scss
/* ── 셸: 헤더 · 레이아웃 · 레일 · 푸터 ── */

.site-header {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; height: 52px;
  background: rgb(var(--bg) / .88);
  backdrop-filter: blur(18px) saturate(1.8);
  border-bottom: 1px solid rgb(var(--line) / .55);
}
.header-logo { font-size: 13px; font-weight: 600; color: rgb(var(--muted)); }
.header-logo b { color: rgb(var(--fg)); font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 14px; }
.header-meta {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em;
  text-transform: uppercase; color: rgb(var(--muted));
}

.icon-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: 1px solid rgb(var(--line));
  background: transparent; color: rgb(var(--muted));
  cursor: pointer; transition: color .15s, border-color .15s;
}
.icon-btn:hover { color: rgb(var(--fg)); border-color: rgb(var(--fg) / .3); }

.layout {
  max-width: 1160px; margin: 0 auto; padding: 0 28px 120px;
  display: grid; grid-template-columns: 13rem 1fr; gap: 0 56px;
  align-items: start;
}
.content { min-width: 0; }

.rail { position: sticky; top: 68px; align-self: start; padding-top: 40px; }
.rail-label {
  font-family: var(--font-mono); font-size: 9px; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase;
  color: rgb(var(--muted)); margin-bottom: 14px;
}
.rail-part {
  font-size: 10px; font-weight: 700; color: rgb(var(--muted));
  letter-spacing: .06em; text-transform: uppercase;
  margin: 18px 0 7px; padding-top: 12px;
  border-top: 1px solid rgb(var(--line) / .5);
}
.rail ul { list-style: none; margin: 0; padding: 0; }
.rail li { margin-bottom: 1px; }
.rail a {
  display: flex; align-items: baseline; gap: 9px;
  padding: 4px 0; font-size: 12.5px; line-height: 1.35;
  color: rgb(var(--muted)); transition: color .13s;
}
.rail a:hover, .rail a.act { color: rgb(var(--fg)); }
.rail a .n {
  font-family: var(--font-mono); font-size: 9px;
  color: rgb(var(--accent)); min-width: 18px;
}
.rail a.sub { padding-left: 27px; font-size: 12px; }
.rail-footer {
  margin-top: 24px; padding-top: 14px;
  border-top: 1px solid rgb(var(--line) / .5);
  display: flex; align-items: center; gap: 8px;
}
.rail-footer span { font-size: 11px; color: rgb(var(--muted)); }

.icon-btn.rail-open { display: none; }

/* 모바일: 레일을 드로어로 */
@media (max-width: 1024px) {
  .layout { grid-template-columns: 1fr; }
  .icon-btn.rail-open { display: flex; }
  .rail {
    position: fixed; inset: 52px auto 0 0; z-index: 90;
    width: 16rem; padding: 24px 20px;
    background: rgb(var(--bg));
    border-right: 1px solid rgb(var(--line));
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform .2s ease;
  }
  .rail.open { transform: translateX(0); }
}

.site-footer {
  border-top: 1px solid rgb(var(--line));
  background: rgb(var(--subtle));
  padding: 56px 28px 40px;
}
```

- [ ] **Step 13: 포스트 CSS 작성**

`_sass/custom/_post.scss`:

```scss
/* ── 포스트 헤더 ── */
.post-head {
  padding: 72px 0 40px;
  border-bottom: 1px solid rgb(var(--line) / .4);
  margin-bottom: 40px;
}
.eyebrow {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: .13em;
  text-transform: uppercase; color: rgb(var(--muted)); margin-bottom: 24px;
}
.eyebrow .ac { color: rgb(var(--accent)); font-weight: 700; }

.post-title {
  font-size: clamp(30px, 4vw, 46px); font-weight: 900;
  line-height: 1.12; letter-spacing: -.03em;
  color: rgb(var(--fg)); text-wrap: balance; margin: 0 0 18px;
}
.post-meta {
  font-family: var(--font-mono); font-size: 11px;
  color: rgb(var(--muted)); display: flex; gap: 8px; flex-wrap: wrap;
}
.post-meta .sep { opacity: .5; }

.post-body { max-width: 46rem; }
.post-tags { margin-top: 56px; }
```

- [ ] **Step 14: 목차 스크립트 작성**

`assets/js/contents-rail.js`:

```js
(function () {
  var MIN_H2 = 2;

  function slugify(text) {
    return text.trim().toLowerCase()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function buildToc(main, tocEl, navEl) {
    var h2s = main.querySelectorAll("h2");
    if (h2s.length < MIN_H2) return null;

    var heads = main.querySelectorAll("h2, h3");
    var list = document.createElement("ul");
    var counter = 0;
    var items = [];

    Array.prototype.forEach.call(heads, function (h) {
      if (!h.id) h.id = slugify(h.textContent);
      var a = document.createElement("a");
      a.href = "#" + h.id;

      if (h.tagName === "H2") {
        counter += 1;
        var num = document.createElement("span");
        num.className = "n";
        num.textContent = counter < 10 ? "0" + counter : String(counter);
        a.appendChild(num);
      } else {
        a.className = "sub";
      }
      a.appendChild(document.createTextNode(h.textContent));

      var li = document.createElement("li");
      li.appendChild(a);
      list.appendChild(li);
      items.push({ heading: h, link: a });
    });

    tocEl.appendChild(list);
    tocEl.hidden = false;
    navEl.hidden = true;
    return items;
  }

  function trackScroll(items) {
    if (!("IntersectionObserver" in window)) return;
    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      var activeId = null;
      for (var i = 0; i < items.length; i++) {
        if (visible.has(items[i].heading.id)) { activeId = items[i].heading.id; break; }
      }
      items.forEach(function (it) {
        it.link.classList.toggle("act", it.heading.id === activeId);
      });
    }, { rootMargin: "-60px 0px -70% 0px" });

    items.forEach(function (it) { observer.observe(it.heading); });
  }

  function wireDrawer(rail) {
    var toggles = document.querySelectorAll(".rail-open");
    Array.prototype.forEach.call(toggles, function (btn) {
      btn.addEventListener("click", function () {
        var open = rail.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.getElementById("main");
    var rail = document.getElementById("contents-rail");
    var tocEl = document.getElementById("rail-toc");
    var navEl = document.getElementById("rail-nav");
    if (!main || !rail || !tocEl || !navEl) return;

    wireDrawer(rail);
    var items = buildToc(main, tocEl, navEl);
    if (items) trackScroll(items);
  });
})();
```

- [ ] **Step 15: SCSS 임포트와 스크립트 목록 갱신**

`assets/css/main.scss`의 커스텀 임포트 블록을 다음으로 교체 (MM 임포트는 4단계까지 유지):

```scss
/* ── 세미나 디자인 시스템 ── */
@import "custom/tokens";
@import "custom/base";
@import "custom/components";
@import "custom/layout";
@import "custom/shell";
@import "custom/post";
```

`_config.yml`의 `after_footer_scripts`를 교체:

```yaml
after_footer_scripts:
  - https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js
  - /assets/js/theme-toggle.js
  - /assets/js/mermaid-init.js
  - /assets/js/contents-rail.js
```

> `sidebar-toggle.js`, `permalink-fix.js`, `toc-active-fix.js`를 목록에서 뺀다. 파일 삭제는 4단계에서 한다 (MM 레이아웃이 아직 살아 있으므로).

- [ ] **Step 16: 포스트 기본 레이아웃 전환**

`_config.yml:97` 의 `layout: single` 을 `layout: post` 로 변경한다 (posts scope, 93~105행 블록). `_pages` scope(110행)는 이번 태스크에서 건드리지 않는다.

- [ ] **Step 17: 테스트 통과 확인**

```bash
npx jest __tests__/shell.test.js
```

Expected: PASS (전 항목)

- [ ] **Step 18: 빌드**

```bash
bundle exec jekyll build
```

Expected: 에러 없이 완료. 경고는 Sass deprecation(테마 유래)만 허용.

- [ ] **Step 19: 브라우저 확인**

```bash
bundle exec jekyll serve --port 4001 --skip-initial-build
```

claude-in-chrome으로 `http://127.0.0.1:4001/aws/ai%20engineering/2026/06/15/aidlc-hands-on-retail-mvp-lessons.html` 을 연다.

확인 항목:
1. 52px sticky 헤더가 스크롤해도 고정되는가
2. 좌측 레일에 `01 개요 …` 형태의 번호 매긴 목차가 뜨는가
3. 스크롤에 따라 현재 항목이 강조되는가
4. 테마 버튼 두 개(헤더·레일)가 모두 동작하는가
5. 다크로 바꾼 뒤 새로고침해도 유지되는가
6. mermaid 다이어그램 색이 테마를 따라가는가
7. 1440px / 375px 양쪽 — 375px에서 레일이 드로어로 열리는가
8. macOS 시스템 설정을 다크로 두고 시크릿 창으로 열면 다크로 뜨는가

각 항목을 라이트/다크 양쪽에서 스크린샷으로 남긴다.

- [ ] **Step 20: 커밋**

```bash
git add _layouts/default.html _layouts/post.html \
        _includes/site-header.html _includes/contents-rail.html \
        _data/categories.yml \
        _sass/custom/_tokens.scss _sass/custom/_shell.scss _sass/custom/_post.scss \
        assets/css/main.scss assets/js/theme-toggle.js assets/js/mermaid-init.js \
        assets/js/contents-rail.js _includes/head/custom.html \
        _config.yml __tests__/shell.test.js
git commit -m "feat: 세미나 셸과 포스트 레이아웃, 3-상태 테마 (1/6)"
```

---

## Task 2: page 레이아웃과 `_pages` 20개 이관

**Files:**
- Create: `_layouts/page.html`
- Modify: `_pages/*.md` (19개), `_config.yml:110`, `_includes/footer.html`, `__tests__/shell.test.js`
- Test: `__tests__/shell.test.js`

**Interfaces:**
- Consumes: Task 1의 `_layouts/default.html`, `_data/categories.yml`
- Produces: `_layouts/page.html` — Task 3의 `home.html`이 동일한 `.page-head` 마크업 규약을 따름

- [ ] **Step 1: 실패 테스트 추가**

`__tests__/shell.test.js` 끝에 추가:

```js
describe('페이지 이관', () => {
  const pageFiles = () => {
    const glob = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap((e) => e.isDirectory() ? glob(path.join(dir, e.name))
                                      : [path.join(dir, e.name)])
      .filter((f) => f.endsWith('.md'));
    return glob('_pages');
  };

  test('_pages는 20개다', () => {
    expect(pageFiles()).toHaveLength(20);
  });

  test('어떤 _pages 파일도 single/tags 레이아웃을 쓰지 않는다', () => {
    pageFiles().forEach((f) => {
      const src = readFileContent(f);
      expect(src).not.toMatch(/^layout:\s*(single|tags)\s*$/m);
    });
  });

  test('_pages 기본 레이아웃이 page이다', () => {
    const cfg = readYaml('_config.yml');
    const d = cfg.defaults.find((x) => x.scope.path === '_pages');
    expect(d.values.layout).toBe('page');
  });

  test('푸터가 카테고리를 하드코딩하지 않는다', () => {
    const html = readFileContent('_includes/footer.html');
    expect(html).toMatch(/site\.data\.categories/);
    expect(html).not.toMatch(/categories\/azure\//);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest __tests__/shell.test.js -t '페이지 이관'
```

Expected: FAIL — `layout: single` 이 18개 파일에 남아 있음

- [ ] **Step 3: page 레이아웃 생성**

`_layouts/page.html`:

```liquid
---
layout: default
---
<article class="page">
  <header class="page-head">
    <h1 class="page-title">{{ page.title }}</h1>
    {%- if page.subtitle -%}<p class="page-sub">{{ page.subtitle }}</p>{%- endif -%}
  </header>
  <div class="post-body">
    {{ content }}
  </div>
</article>
```

- [ ] **Step 4: `.page-head` 스타일 추가**

`_sass/custom/_post.scss` 끝에 추가:

```scss
.page-head {
  padding: 64px 0 32px;
  border-bottom: 1px solid rgb(var(--line) / .4);
  margin-bottom: 36px;
}
.page-title {
  font-size: clamp(26px, 3.2vw, 38px); font-weight: 800;
  line-height: 1.15; letter-spacing: -.025em;
  color: rgb(var(--fg)); margin: 0;
}
.page-sub { margin-top: 10px; color: rgb(var(--muted)); font-size: 15px; }
```

- [ ] **Step 5: `_pages` 레이아웃 일괄 치환**

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/2026/03_Study/blog
find _pages -name '*.md' -exec sed -i '' 's/^layout: single$/layout: page/' {} +
sed -i '' 's/^layout: tags$/layout: page/' _pages/tags.md
grep -rn "^layout:" _pages | sort | uniq -c
```

Expected: 모두 `layout: page` (19개) — `about.md`는 여전히 미기재

- [ ] **Step 6: `_config.yml` `_pages` 기본값 변경**

110행 `layout: single` → `layout: page`

- [ ] **Step 7: 푸터를 데이터 파일 기반으로**

`_includes/footer.html`의 `<!-- 카테고리 바로가기 -->` 블록 안 `<ul>…</ul>` 을 교체:

```liquid
    <ul>
      {%- for c in site.data.categories -%}
      <li><a href="{{ c.url | relative_url }}">{{ c.title }}</a></li>
      {%- endfor -%}
    </ul>
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
npx jest __tests__/shell.test.js
```

Expected: PASS

- [ ] **Step 9: 빌드 후 브라우저 확인**

```bash
bundle exec jekyll build && bundle exec jekyll serve --port 4001 --skip-initial-build
```

확인 페이지 4종 (각각 라이트/다크, 1440/375):

| URL | 확인 |
|---|---|
| `/categories/aws/` | 카테고리 랜딩 — 하위 카테고리 목록이 렌더링되는가 |
| `/categories/azure/kubernetes/` | 토픽 허브 — 포스트 목록 링크가 살아 있는가 |
| `/tags/` | 태그 목록이 `page` 레이아웃에서 정상 렌더링되는가 |
| `/about/` | layout 미기재 파일이 default 경로로 `page`를 타는가 |

레일 규칙 확인: h2가 2개 이상인 페이지는 목차, 그 외는 카테고리 내비가 떠야 한다. **레일이 빈 페이지가 하나도 없어야 한다.**

- [ ] **Step 10: 커밋**

```bash
git add _layouts/page.html _sass/custom/_post.scss _pages _config.yml \
        _includes/footer.html __tests__/shell.test.js
git commit -m "feat: page 레이아웃과 _pages 20개 이관, 푸터 카테고리 데이터화 (2/6)"
```

---

## Task 3: home 레이아웃과 페이지네이션

**Files:**
- Create: `_layouts/home.html`
- Modify: `index.html`, `_sass/custom/_post.scss`, `__tests__/shell.test.js`
- Test: `__tests__/shell.test.js`

**Interfaces:**
- Consumes: Task 1의 `_layouts/default.html`, Task 2의 `.page-head` 스타일
- Produces: `.post-card` 컴포넌트 — Task 5의 검색 결과 행이 같은 시각 언어를 따름

- [ ] **Step 1: 실패 테스트 추가**

```js
describe('홈', () => {
  test('index.html이 home 레이아웃을 쓴다', () => {
    expect(readFileContent('index.html')).toMatch(/^layout: home$/m);
  });

  test('home 레이아웃이 paginator를 쓴다', () => {
    expect(readFileContent('_layouts/home.html')).toMatch(/paginator\.posts/);
  });

  test('home 레이아웃에 author_profile 잔재가 없다', () => {
    expect(readFileContent('_layouts/home.html')).not.toMatch(/author.profile/);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest __tests__/shell.test.js -t '홈'
```

Expected: FAIL — `_layouts/home.html` 없음

- [ ] **Step 3: home 레이아웃 생성**

`_layouts/home.html`:

```liquid
---
layout: default
---
<div class="home">
  <header class="page-head">
    <div class="eyebrow">Recent</div>
    <h1 class="page-title">{{ site.title }}</h1>
    {%- if site.description -%}<p class="page-sub">{{ site.description }}</p>{%- endif -%}
  </header>

  <ul class="post-list">
    {%- for post in paginator.posts -%}
    <li class="post-card">
      {%- if post.categories.size > 0 -%}
      <div class="eyebrow">
        <span class="ac">{{ forloop.index | prepend: '0' | slice: -2, 2 }}</span>
        {{ post.categories | join: ' · ' | upcase }}
      </div>
      {%- endif -%}
      <h2 class="post-card__title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h2>
      <div class="post-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%Y.%m.%d' }}</time>
      </div>
      {%- if post.excerpt -%}
      <p class="post-card__excerpt">{{ post.excerpt | strip_html | truncate: 140 }}</p>
      {%- endif -%}
    </li>
    {%- endfor -%}
  </ul>

  {%- if paginator.total_pages > 1 -%}
  <nav class="pager" aria-label="페이지 이동">
    {%- if paginator.previous_page -%}
    <a href="{{ paginator.previous_page_path | relative_url }}">← 이전</a>
    {%- endif -%}
    <span class="pager-status">{{ paginator.page }} / {{ paginator.total_pages }}</span>
    {%- if paginator.next_page -%}
    <a href="{{ paginator.next_page_path | relative_url }}">다음 →</a>
    {%- endif -%}
  </nav>
  {%- endif -%}
</div>
```

- [ ] **Step 4: `index.html` 정리**

전체를 다음으로 교체:

```
---
layout: home
---
```

- [ ] **Step 5: 홈 CSS 추가**

`_sass/custom/_post.scss` 끝에 추가:

```scss
/* ── 홈 목록 ── */
.post-list { list-style: none; margin: 0; padding: 0; }
.post-card {
  padding: 28px 0;
  border-bottom: 1px solid rgb(var(--line) / .5);
}
.post-card .eyebrow { margin-bottom: 10px; }
.post-card__title {
  font-size: clamp(19px, 2vw, 24px); font-weight: 700;
  line-height: 1.3; letter-spacing: -.02em; margin: 0 0 8px;
}
.post-card__title a { color: rgb(var(--fg)); text-decoration: none; }
.post-card__title a:hover { color: rgb(var(--accent)); }
.post-card__excerpt {
  margin: 10px 0 0; color: rgb(var(--muted));
  font-size: 14.5px; line-height: 1.65;
}

.pager {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-top: 48px; padding-top: 20px;
  border-top: 1px solid rgb(var(--line));
}
.pager a { font-size: 13px; color: rgb(var(--muted)); }
.pager a:hover { color: rgb(var(--accent)); }
.pager-status {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: .1em; color: rgb(var(--muted));
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npx jest __tests__/shell.test.js
```

Expected: PASS

- [ ] **Step 7: 빌드 후 브라우저 확인**

```bash
bundle exec jekyll build && bundle exec jekyll serve --port 4001 --skip-initial-build
```

`/` 와 `/page2/` 확인 (라이트/다크, 1440/375):

1. 포스트 제목에 밑줄이 없는가 (현재 상태의 문제점)
2. 우측에 빈 영역이 남지 않는가 (현재 1440px에서 약 330px 빔)
3. 페이지네이션이 `/page2/`로 넘어가고 되돌아오는가
4. 레일에 카테고리 내비가 뜨는가 (홈은 h2가 없으므로)

- [ ] **Step 8: 커밋**

```bash
git add _layouts/home.html index.html _sass/custom/_post.scss __tests__/shell.test.js
git commit -m "feat: home 레이아웃과 페이지네이션 (3/6)"
```

---

## Task 4: minimal-mistakes CSS 제거와 색상 정리

**Files:**
- Modify: `assets/css/main.scss`, `_sass/custom/_layout.scss`(해체), `_sass/custom/_base.scss`, `_sass/custom/_components.scss`, `__tests__/shell.test.js`
- Delete: `_includes/masthead.html`, `_includes/sidebar.html`, `_includes/sidebar-custom.html`, `_includes/author-profile.html`, `_includes/author-profile-custom-links.html`, `assets/js/permalink-fix.js`, `assets/js/toc-active-fix.js`, `assets/js/sidebar-toggle.js`
- Test: `__tests__/shell.test.js`

**Interfaces:**
- Consumes: Task 1~3의 레이아웃 전부 (MM 클래스를 쓰는 레이아웃이 남아 있지 않아야 이 태스크가 안전하다)

> **선행 조건:** Task 1~3이 끝나 `_layouts/`의 4종만으로 모든 페이지가 렌더링되어야 한다. 이 태스크 시작 전 `grep -rn "layout:" _pages _posts index.html | grep -v "page\|post\|home"` 이 빈 결과여야 한다.

- [ ] **Step 1: 실패 테스트 추가**

```js
describe('minimal-mistakes 제거 (CSS)', () => {
  test('main.scss가 MM을 임포트하지 않는다', () => {
    const scss = readFileContent('assets/css/main.scss');
    expect(scss).not.toMatch(/@import\s+["']minimal-mistakes/);
  });

  test('MM 전용 include가 남아 있지 않다', () => {
    ['_includes/masthead.html', '_includes/sidebar.html',
     '_includes/author-profile.html'].forEach((f) => {
      expect(fs.existsSync(path.join(ROOT, f))).toBe(false);
    });
  });

  test('MM DOM에 묶인 JS가 삭제됐다', () => {
    ['assets/js/permalink-fix.js', 'assets/js/toc-active-fix.js',
     'assets/js/sidebar-toggle.js'].forEach((f) => {
      expect(fs.existsSync(path.join(ROOT, f))).toBe(false);
    });
  });
});

describe('색상 규칙 (전역)', () => {
  test('_tokens.scss 외 커스텀 SCSS에 hex 리터럴이 없다', () => {
    const dir = path.join(ROOT, '_sass/custom');
    const offenders = [];
    fs.readdirSync(dir).forEach((f) => {
      if (f === '_tokens.scss') return;
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      // rouge 예외 블록은 ROUGE-EXCEPTION 주석 사이를 건너뛴다
      const scrubbed = src.replace(
        /\/\* ROUGE-EXCEPTION-START \*\/[\s\S]*?\/\* ROUGE-EXCEPTION-END \*\//g, ''
      );
      (scrubbed.match(/#[0-9a-fA-F]{3,8}\b/g) || [])
        .forEach((h) => offenders.push(`${f}: ${h}`));
    });
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest __tests__/shell.test.js -t 'minimal-mistakes 제거'
npx jest __tests__/shell.test.js -t '색상 규칙 (전역)'
```

Expected: FAIL — MM 임포트 존재, hex 리터럴 다수(약 34종)

- [ ] **Step 3: MM 임포트 제거**

`assets/css/main.scss` 전체 교체:

```scss
---
---

/* ── 세미나 디자인 시스템 ──
   minimal-mistakes 임포트를 제거했다. 모든 스타일은 아래 파티셜에서 나온다. */
@import "custom/tokens";
@import "custom/base";
@import "custom/components";
@import "custom/shell";
@import "custom/post";
```

> `custom/layout`이 빠졌다. 다음 스텝에서 해체한다.

- [ ] **Step 4: `_layout.scss` 해체**

`_sass/custom/_layout.scss`(793줄)를 열어 규칙을 세 갈래로 나눈다.

| 분류 | 처리 |
|---|---|
| MM 클래스 전용 (`.masthead`, `.sidebar`, `.archive__item`, `.page__content`, `.greedy-nav`, `.author__*`) | **삭제** — 해당 DOM이 더는 생성되지 않는다 |
| 여전히 필요한 전역 (표·코드블록·인용구·이미지·링크) | `_base.scss`로 이관 |
| 셸/포스트 관련 | Task 1·3에서 이미 `_shell.scss`·`_post.scss`에 작성됨 → 중복이면 삭제 |

이관 시 **hex 리터럴을 전부 토큰 참조로 바꾼다.** 대응표:

```
#f5f5f7 → rgb(var(--subtle))        #1d1d1f → rgb(var(--fg))
#0066cc → rgb(var(--accent))        #2997ff → rgb(var(--accent))   (다크 토큰이 처리)
#ffffff #fff → rgb(var(--bg))       #eee #ddd → rgb(var(--line))
#777 #888 #999 → rgb(var(--muted))  #666 #555 #333 → rgb(var(--fg) / .75)
#f0f6fd #e5f0fb → rgb(var(--accent) / .06)
#5b8bc4 #1d5c99 #9ec4e8 #6cb4ee → rgb(var(--accent))
#101f30 #0d2a45 #15263a #0a1929 #1c1c1e → rgb(var(--subtle))
#5cb85c → rgb(var(--ok))   #e8c300 → rgb(var(--warn))   #d9534f → rgb(var(--danger))
#0a2910 → rgb(var(--ok) / .12)   #2a2200 → rgb(var(--warn) / .12)   #2a0a0a → rgb(var(--danger) / .12)
```

rouge 팔레트(`#c9d1d9`, `#0d1117`, `#494e52` 등 코드 하이라이트 색)는 `_base.scss` 안에 다음 형태로 격리한다:

```scss
/* ROUGE-EXCEPTION-START
   코드 하이라이트 팔레트. 토큰 규칙의 유일한 예외다.
   테마별 대비를 직접 맞춰야 해 알파 합성으로 대체할 수 없다. */
.highlight { /* … 기존 rouge 색 … */ }
/* ROUGE-EXCEPTION-END */
```

작업 후 `_sass/custom/_layout.scss`를 삭제한다.

- [ ] **Step 5: MM 전용 include·JS 삭제**

```bash
git rm _includes/masthead.html _includes/sidebar.html _includes/sidebar-custom.html \
       _includes/author-profile.html _includes/author-profile-custom-links.html \
       assets/js/permalink-fix.js assets/js/toc-active-fix.js assets/js/sidebar-toggle.js
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npx jest __tests__/shell.test.js
```

Expected: PASS (전 항목). 실패하면 남은 hex를 위 대응표로 계속 치환한다.

- [ ] **Step 7: 빌드 산출물 단언**

```bash
bundle exec jekyll build
grep -rl "page__content\|archive__item\|greedy-nav\|author__avatar" _site --include="*.html" | head
```

Expected: 빈 결과. 하나라도 나오면 해당 페이지의 레이아웃이 아직 MM을 타고 있다는 뜻이다.

- [ ] **Step 8: 전체 페이지 브라우저 확인**

```bash
bundle exec jekyll serve --port 4001 --skip-initial-build
```

**전체 체크리스트 (7종 × 라이트/다크 × 1440/375)**

| # | 페이지 |
|---|---|
| 1 | `/` |
| 2 | `/aws/ai%20engineering/2026/06/15/aidlc-hands-on-retail-mvp-lessons.html` |
| 3 | `/categories/aws/` |
| 4 | `/categories/azure/kubernetes/` |
| 5 | `/tags/` |
| 6 | `/about/` |
| 7 | `/page2/` |

각 컷에서: sticky 헤더, 레일이 비지 않음, 본문 폭·여백, **표·코드블록 가로 넘침**, mermaid 팔레트, 이미지 반응형, 푸터.

**색상 회귀를 특히 본다** — 34종을 걷어냈으므로 의도치 않게 바뀐 색이 없는지 라이트/다크 양쪽에서 확인한다.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "refactor: minimal-mistakes CSS 제거, 하드코딩 색 34종을 토큰으로 (4/6)"
```

---

## Task 5: 검색 교체

**Files:**
- Create: `_plugins/search_index.rb`, `assets/js/search-core.js`, `assets/js/search-ui.js`, `_includes/search-overlay.html`, `_sass/custom/_search.scss`, `__tests__/search-core.test.ts`
- Modify: `_includes/site-header.html`, `_layouts/default.html`, `assets/css/main.scss`, `_config.yml`, `__tests__/shell.test.js`
- Test: `__tests__/search-core.test.ts` (vitest), `__tests__/shell.test.js` (jest)

**Interfaces:**
- Consumes: Task 1의 `.icon-btn` 스타일, Task 3의 `.post-card` 시각 언어
- Produces: `search-core.js` ES 모듈 —
  - `normalize(s: string) → string`
  - `WEIGHTS: { t:8, h:4, g:3, c:3, e:2, b:1 }`
  - `search(index: Doc[], query: string, limit = 20) → Result[]`
    - `Doc = { t, u, d, c[], g[], h[], e, b }`
    - `Result = { doc: Doc, score: number, snippet: string }`
  - `makeSnippet(body: string, term: string, radius = 60) → string`
- Produces: `/search-index.json` — `Doc[]`

- [ ] **Step 1: 실패 테스트 작성 (순수 함수)**

`__tests__/search-core.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { normalize, search, makeSnippet } from '../assets/js/search-core.js';

const INDEX = [
  { t: '쿠버네티스 Deep Dive - API Server 내부 동작 원리', u: '/k8s-deep/', d: '2026-03-22',
    c: ['Azure'], g: ['Kubernetes'], h: ['API Server 구조'], e: '쿠버네티스 API 서버를 뜯어본다', b: 'kube-apiserver는 …' },
  { t: '쿠버네티스 고급 - RBAC, Network Policy', u: '/k8s-adv/', d: '2026-03-15',
    c: ['Azure'], g: ['Kubernetes'], h: ['RBAC'], e: '고급 주제', b: '권한 제어 …' },
  { t: '쿠버네티스 중급', u: '/k8s-mid/', d: '2026-03-08',
    c: ['Azure'], g: ['Kubernetes'], h: [], e: '중급', b: '파드와 서비스 …' },
  { t: 'Terraform 표준 가이드', u: '/tf/', d: '2026-02-01',
    c: ['Terraform'], g: ['IaC'], h: ['원칙'], e: 'Terraform 원칙', b: 'state 관리 …' },
  { t: '3만 SKU 유사상품 추천', u: '/rec/', d: '2026-06-15',
    c: ['AWS'], g: ['Bedrock'], h: ['임베딩 파이프라인'], e: '추천 서비스',
    b: '임베딩은 1024차원이며 임베딩을 미리 계산한다' },
];

describe('normalize', () => {
  test('소문자화하고 공백을 정리한다', () => {
    expect(normalize('  Hello   World ')).toBe('hello world');
  });
  test('NFC로 정규화한다 (한글 자모 결합)', () => {
    expect(normalize('가')).toBe(normalize('가'));
  });
  test('null·undefined를 빈 문자열로 처리한다', () => {
    expect(normalize(undefined as unknown as string)).toBe('');
  });
});

describe('search — 한국어', () => {
  test('"쿠버네티스"가 3건을 찾는다 (현행 lunr은 0건)', () => {
    const r = search(INDEX, '쿠버네티스');
    expect(r).toHaveLength(3);
  });

  test('조사가 붙은 형태에도 매치한다 — "임베딩" → "임베딩은"', () => {
    const r = search(INDEX, '임베딩');
    expect(r.map((x) => x.doc.u)).toContain('/rec/');
  });
});

describe('search — 영문·혼합', () => {
  test('영문 단어를 대소문자 무관하게 찾는다', () => {
    expect(search(INDEX, 'terraform')).toHaveLength(1);
    expect(search(INDEX, 'TERRAFORM')).toHaveLength(1);
  });

  test('여러 단어는 AND로 동작한다', () => {
    expect(search(INDEX, '쿠버네티스 RBAC')).toHaveLength(1);
    expect(search(INDEX, '쿠버네티스 존재하지않는말')).toHaveLength(0);
  });
});

describe('search — 점수와 정렬', () => {
  test('제목 매치가 본문 매치보다 앞선다', () => {
    const r = search(INDEX, '쿠버네티스');
    expect(r[0].doc.t).toMatch(/^쿠버네티스/);
  });

  test('동점이면 최신순이다', () => {
    const r = search(INDEX, '쿠버네티스');
    const dates = r.map((x) => x.doc.d);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test('limit을 넘기지 않는다', () => {
    expect(search(INDEX, '쿠버네티스', 2)).toHaveLength(2);
  });
});

describe('search — 빈 상태', () => {
  test('빈 쿼리는 빈 배열을 반환한다', () => {
    expect(search(INDEX, '')).toEqual([]);
    expect(search(INDEX, '   ')).toEqual([]);
  });

  test('결과 없음은 빈 배열이다 (이전 결과를 남기지 않는다)', () => {
    expect(search(INDEX, 'zzzz없는단어')).toEqual([]);
  });
});

describe('makeSnippet', () => {
  test('매치 주변을 잘라 온다', () => {
    const s = makeSnippet('앞부분 '.repeat(30) + '임베딩 핵심' + ' 뒷부분'.repeat(30), '임베딩', 20);
    expect(s).toContain('임베딩');
    expect(s.length).toBeLessThan(120);
  });

  test('매치가 없으면 앞부분을 반환한다', () => {
    expect(makeSnippet('가나다라마바사', '없음', 3)).toContain('가나다');
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx vitest run __tests__/search-core.test.ts
```

Expected: FAIL — `Cannot find module '../assets/js/search-core.js'`

- [ ] **Step 3: 순수 함수 구현**

`assets/js/search-core.js`:

```js
export const WEIGHTS = { t: 8, h: 4, g: 3, c: 3, e: 2, b: 1 };

export function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

function fieldsOf(doc) {
  return {
    t: normalize(doc.t),
    h: normalize((doc.h || []).join(" ")),
    g: normalize((doc.g || []).join(" ")),
    c: normalize((doc.c || []).join(" ")),
    e: normalize(doc.e),
    b: normalize(doc.b),
  };
}

export function makeSnippet(body, term, radius = 60) {
  const text = String(body || "");
  const at = normalize(text).indexOf(normalize(term));
  if (at < 0) return text.slice(0, radius * 2).trim();
  const from = Math.max(0, at - radius);
  const to = Math.min(text.length, at + term.length + radius);
  return (from > 0 ? "…" : "") + text.slice(from, to).trim() + (to < text.length ? "…" : "");
}

export function search(index, query, limit = 20) {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(" ").filter(Boolean);
  if (terms.length === 0) return [];

  const keys = Object.keys(WEIGHTS);
  const results = [];

  for (const doc of index) {
    const fields = fieldsOf(doc);
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      let best = 0;
      for (const k of keys) {
        if (fields[k].includes(term)) best = Math.max(best, WEIGHTS[k]);
      }
      if (best === 0) { matchedAll = false; break; }
      score += best;
    }

    if (matchedAll) {
      results.push({ doc, score, snippet: makeSnippet(doc.b, terms[0]) });
    }
  }

  results.sort((a, b) => (b.score - a.score) || (a.doc.d < b.doc.d ? 1 : a.doc.d > b.doc.d ? -1 : 0));
  return results.slice(0, limit);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/search-core.test.ts
```

Expected: PASS (전 항목). **"쿠버네티스 → 3건"이 통과하면 스펙의 첫 실패 테스트가 해소된 것이다.**

- [ ] **Step 5: 인덱스 제너레이터 작성**

`_plugins/search_index.rb`:

```ruby
# search-index.json 생성기.
# GitHub Actions가 `bundle exec jekyll build`를 직접 실행하므로 커스텀 플러그인이 동작한다.
require "json"
require "nokogiri"

module SearchIndex
  MAX_BODY = 8000

  class Generator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      docs = (site.posts.docs + site.pages).filter_map { |doc| entry(site, doc) }
      site.pages << IndexFile.new(site, docs)
    end

    private

    def entry(site, doc)
      url = doc.url.to_s
      return nil if url.end_with?(".json", ".xml", ".txt")
      return nil if doc.data["search"] == false
      title = doc.data["title"].to_s
      return nil if title.empty?

      html = Nokogiri::HTML5.fragment(doc.output.to_s)
      headings = html.css("h2, h3").map { |h| h.text.strip }.reject(&:empty?)
      body = html.text.gsub(/\s+/, " ").strip[0, MAX_BODY]

      {
        "t" => title,
        "u" => url,
        "d" => (doc.data["date"] ? doc.data["date"].strftime("%Y-%m-%d") : ""),
        "c" => Array(doc.data["categories"]),
        "g" => Array(doc.data["tags"]),
        "h" => headings,
        "e" => doc.data["excerpt"].to_s.gsub(/<[^>]+>/, "").gsub(/\s+/, " ").strip[0, 300],
        "b" => body,
      }
    end
  end

  class IndexFile < Jekyll::Page
    def initialize(site, docs)
      @site = site
      @base = site.source
      @dir = "."
      @name = "search-index.json"
      process(@name)
      self.data = { "layout" => nil, "sitemap" => false }
      self.content = JSON.generate(docs)
    end
  end
end
```

> `doc.output`은 렌더링 후에만 채워지므로 `priority :low`가 필요하다. Nokogiri는 Jekyll의 기존 의존성이다.

- [ ] **Step 6: 검색 오버레이 마크업**

`_includes/search-overlay.html`:

```liquid
<div class="search-overlay" id="search-overlay" hidden>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="검색">
    <div class="search-eyebrow">Search</div>
    <input type="search" id="search-input" class="search-input"
           placeholder="제목·본문 검색" autocomplete="off" spellcheck="false">
    <div class="search-status" id="search-status"></div>
    <ul class="search-results" id="search-results"></ul>
  </div>
</div>
```

- [ ] **Step 7: 검색 UI 스크립트**

`assets/js/search-ui.js`:

```js
import { search } from "./search-core.js";

(function () {
  var index = null;
  var loading = false;
  var activeIndex = -1;
  var results = [];

  function $(id) { return document.getElementById(id); }

  function setStatus(text) { $("search-status").textContent = text; }

  function render() {
    var list = $("search-results");
    list.innerHTML = "";
    activeIndex = -1;

    if (results.length === 0) return;

    results.forEach(function (r, i) {
      var li = document.createElement("li");
      li.className = "search-hit";

      var a = document.createElement("a");
      a.href = r.doc.u;

      if (r.doc.c && r.doc.c.length) {
        var chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = r.doc.c[0];
        a.appendChild(chip);
      }

      var title = document.createElement("span");
      title.className = "search-hit__title";
      title.textContent = r.doc.t;
      a.appendChild(title);

      var meta = document.createElement("span");
      meta.className = "search-hit__meta";
      meta.textContent = r.doc.d;
      a.appendChild(meta);

      var snip = document.createElement("p");
      snip.className = "search-hit__snippet";
      snip.textContent = r.snippet;
      a.appendChild(snip);

      li.appendChild(a);
      list.appendChild(li);
      r.el = a;
    });
  }

  function run() {
    var q = $("search-input").value;
    if (!q.trim()) { results = []; render(); setStatus(""); return; }
    if (!index) { setStatus("불러오는 중…"); return; }
    results = search(index, q);
    render();
    setStatus(results.length + " RESULTS");
  }

  function loadIndex() {
    if (index || loading) return;
    loading = true;
    setStatus("불러오는 중…");
    fetch("/search-index.json")
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(function (data) { index = data; loading = false; run(); })
      .catch(function () {
        loading = false;
        setStatus("인덱스를 불러오지 못했습니다 · 다시 시도");
      });
  }

  function open() {
    $("search-overlay").hidden = false;
    document.body.classList.add("search-open");
    $("search-input").focus();
    loadIndex();
  }

  function close() {
    $("search-overlay").hidden = true;
    document.body.classList.remove("search-open");
    $("search-input").value = "";
    results = [];
    render();
    setStatus("");
  }

  function move(delta) {
    if (results.length === 0) return;
    activeIndex = (activeIndex + delta + results.length) % results.length;
    results.forEach(function (r, i) {
      r.el.classList.toggle("act", i === activeIndex);
    });
    results[activeIndex].el.scrollIntoView({ block: "nearest" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var opener = document.querySelector(".search-open-btn");
    if (opener) opener.addEventListener("click", open);

    $("search-input").addEventListener("input", run);

    $("search-overlay").addEventListener("click", function (e) {
      if (e.target === $("search-overlay")) close();
    });

    document.addEventListener("keydown", function (e) {
      var overlayOpen = !$("search-overlay").hidden;

      if (!overlayOpen) {
        var typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
        if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          open();
        }
        return;
      }

      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        window.location.href = results[activeIndex].doc.u;
      }
    });
  });
})();
```

- [ ] **Step 8: 검색 CSS**

`_sass/custom/_search.scss`:

```scss
.search-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgb(var(--bg) / .82);
  backdrop-filter: blur(18px) saturate(1.8);
  overflow-y: auto;
}
body.search-open { overflow: hidden; }

.search-panel { max-width: 44rem; margin: 12vh auto 6rem; padding: 0 28px; }

.search-eyebrow {
  font-family: var(--font-mono); font-size: 9px; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase;
  color: rgb(var(--muted)); margin-bottom: 12px;
}

.search-input {
  width: 100%; padding: 14px 16px;
  font-family: var(--font-sans); font-size: 20px;
  color: rgb(var(--fg)); background: rgb(var(--subtle));
  border: 1px solid rgb(var(--line)); border-radius: 10px;
  outline: none; transition: border-color .15s;
}
.search-input:focus { border-color: rgb(var(--accent)); }
.search-input::placeholder { color: rgb(var(--muted)); }

.search-status {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: .1em; text-transform: uppercase;
  color: rgb(var(--muted)); margin: 14px 2px;
  min-height: 1em;
}

.search-results { list-style: none; margin: 0; padding: 0; }
.search-hit { border-top: 1px solid rgb(var(--line) / .5); }
.search-hit a {
  display: block; padding: 16px 12px; border-radius: 8px;
  color: inherit; text-decoration: none;
}
.search-hit a:hover, .search-hit a.act { background: rgb(var(--accent) / .06); }
.search-hit__title {
  display: block; margin-top: 6px;
  font-size: 15.5px; font-weight: 650; color: rgb(var(--fg));
}
.search-hit__meta {
  font-family: var(--font-mono); font-size: 10px; color: rgb(var(--muted));
}
.search-hit__snippet {
  margin: 6px 0 0; font-size: 13px; line-height: 1.6;
  color: rgb(var(--muted));
}
```

- [ ] **Step 9: 배선 — 헤더 버튼·오버레이·임포트**

`_includes/site-header.html`의 `.rail-open` 버튼 **앞**에 추가:

```liquid
    <button class="icon-btn search-open-btn" type="button" aria-label="검색">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.4"/>
        <path d="M10.6 10.6L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
```

`_layouts/default.html`의 `</div>`(`.layout` 닫는 태그) **뒤**, `<footer>` **앞**에 추가:

```liquid
  {%- include search-overlay.html -%}
```

`assets/css/main.scss`에 `@import "custom/search";` 추가.

`_layouts/default.html`의 스크립트 루프 **뒤**에 모듈 스크립트 추가:

```liquid
  <script type="module" src="{{ '/assets/js/search-ui.js' | relative_url }}"></script>
```

`_config.yml`에서 `search: true`, `search_full_content: true` 두 줄을 삭제한다 (MM 전용 설정으로, 우리 검색은 이를 참조하지 않는다).

- [ ] **Step 10: 인덱스 단언 테스트 추가**

`__tests__/shell.test.js`에 추가:

```js
describe('검색 인덱스 (빌드 산출물)', () => {
  const indexPath = path.join(ROOT, '_site/search-index.json');

  test('빌드 후 인덱스가 생성된다', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  test('모든 항목이 필수 필드를 갖는다', () => {
    const docs = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    expect(docs.length).toBeGreaterThan(30);
    docs.forEach((d) => {
      expect(typeof d.t).toBe('string');
      expect(typeof d.u).toBe('string');
      expect(Array.isArray(d.c)).toBe(true);
      expect(Array.isArray(d.h)).toBe(true);
      expect(typeof d.b).toBe('string');
    });
  });

  test('lunr 자산이 더는 생성되지 않는다', () => {
    expect(fs.existsSync(path.join(ROOT, '_site/assets/js/lunr'))).toBe(false);
  });
});
```

- [ ] **Step 11: 빌드하고 전체 테스트**

```bash
bundle exec jekyll build
npx jest __tests__/shell.test.js
npx vitest run __tests__/search-core.test.ts
```

Expected: 모두 PASS

- [ ] **Step 12: 브라우저 확인**

```bash
bundle exec jekyll serve --port 4001 --skip-initial-build
```

| 시나리오 | 기대 |
|---|---|
| 헤더 검색 버튼 클릭 | 오버레이 열림, **입력창 테두리가 또렷이 보임** |
| `쿠버네티스` 입력 | 3건 이상, `3 RESULTS` 표시 |
| `Terraform` 입력 | 결과 표시 |
| `임베딩` 입력 | 추천 서비스 글이 결과에 포함 |
| 입력을 전부 지움 | **결과가 사라짐** (이전 결과가 남지 않음) |
| `zzzz없는단어` | 결과 0건, `0 RESULTS` |
| `↑` `↓` `Enter` | 항목 이동·이동 |
| `Esc` | 닫히고 입력값 초기화 |
| `/` 와 `⌘K` | 어디서든 열림 |
| DevTools Network | 첫 페이지 로드에 `search-index.json` **없음**, 검색 열 때 1회 요청 |
| 오프라인 전환 후 검색 | `인덱스를 불러오지 못했습니다` 표시 |

- [ ] **Step 13: 커밋**

```bash
git add -A
git commit -m "feat: lunr 제거하고 한국어 동작하는 경량 검색으로 교체 (5/6)"
```

---

## Task 6: remote_theme 제거와 마무리

**Files:**
- Modify: `Gemfile`, `_config.yml`, `__tests__/unit.test.js`, `__tests__/shell.test.js`
- Test: 전체 스위트

**Interfaces:**
- Consumes: Task 1~5의 모든 산출물. 이 시점에 minimal-mistakes를 참조하는 코드가 없어야 한다.

> **선행 조건:** `grep -rn "minimal-mistakes\|ui-text\|site.data.ui-text" _layouts _includes assets _config.yml` 이 빈 결과여야 한다.

- [ ] **Step 1: 실패 테스트 작성 — 기존 테스트 갱신 포함**

`__tests__/unit.test.js`의 remote_theme 단언을 찾아 교체한다. 기존:

```js
  test('Gemfile contains Jekyll and remote theme plugin', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/gem\s+["']jekyll["']/);
    expect(gemfile).toMatch(/jekyll-remote-theme/);
  });
```

교체:

```js
  test('Gemfile contains Jekyll and required plugins', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/gem\s+["']jekyll["']/);
    expect(gemfile).toMatch(/jekyll-feed/);
    expect(gemfile).toMatch(/jekyll-paginate/);
  });

  test('minimal-mistakes 테마 의존이 제거됐다', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).not.toMatch(/jekyll-remote-theme/);
    expect(gemfile).not.toMatch(/minimal-mistakes/);
  });
```

`__tests__/shell.test.js`에 추가:

```js
describe('테마 의존 완전 제거', () => {
  test('_config.yml에 remote_theme·skin 설정이 없다', () => {
    const src = readFileContent('_config.yml');
    expect(src).not.toMatch(/^remote_theme:/m);
    expect(src).not.toMatch(/minimal_mistakes_skin/);
    expect(src).not.toMatch(/^search(_full_content)?:/m);
  });

  test('소스 어디에도 minimal-mistakes 참조가 없다', () => {
    const dirs = ['_layouts', '_includes', 'assets/js', 'assets/css'];
    const hits = [];
    const walk = (d) => {
      const abs = path.join(ROOT, d);
      if (!fs.existsSync(abs)) return;
      fs.readdirSync(abs, { withFileTypes: true }).forEach((e) => {
        const rel = path.join(d, e.name);
        if (e.isDirectory()) return walk(rel);
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        if (/minimal-mistakes|ui-text/.test(src)) hits.push(rel);
      });
    };
    dirs.forEach(walk);
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest
```

Expected: FAIL — `remote_theme` 아직 존재

- [ ] **Step 3: Gemfile 정리**

`jekyll-remote-theme`과 `minimal-mistakes-jekyll` 줄을 삭제한다. 남는 내용:

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3"
gem "jekyll-feed"
gem "jekyll-paginate"
gem "jekyll-sitemap"
gem "jekyll-seo-tag"
gem "jekyll-include-cache"
```

```bash
bundle install
```

- [ ] **Step 4: `_config.yml` 정리**

삭제할 항목:

```yaml
remote_theme: "mmistakes/minimal-mistakes@4.26.2"
minimal_mistakes_skin: "air"
search: true
search_full_content: true
```

`plugins:` 목록에서 `jekyll-remote-theme` 제거.

`defaults:`의 posts scope에서 MM 전용 키를 제거한다 — `author_profile`, `share`, `related`, `toc`, `toc_sticky`. 남길 것: `layout: post`, `read_time: true`, `show_date: true`.

`_pages` scope에서도 `author_profile` 제거.

- [ ] **Step 5: 남은 MM 문자열 제거**

```bash
grep -rn "minimal-mistakes\|ui-text\|author_profile" _layouts _includes assets _config.yml
```

나오는 항목을 전부 정리한다. `site.data.ui-text[locale].…` 참조가 있으면 한국어 문자열로 직접 치환한다.

- [ ] **Step 6: 전체 테스트**

```bash
npx jest && npx vitest run
```

Expected: 전부 PASS

- [ ] **Step 7: 클린 빌드**

```bash
rm -rf _site .jekyll-cache
bundle exec jekyll build
```

Expected: 에러 없이 완료. **빌드 시간이 크게 줄어야 한다** (remote_theme fetch가 사라지므로, 기존 약 110초 → 10초 내외).

```bash
grep -rl "page__content\|archive__item\|greedy-nav\|lunr" _site | head
```

Expected: 빈 결과

- [ ] **Step 8: 전체 페이지 최종 확인**

Task 4 Step 8의 7종 체크리스트를 라이트/다크 × 1440/375로 다시 돈다. Task 5의 검색 시나리오도 재확인한다.

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "refactor: minimal-mistakes 의존 완전 제거, 테스트 갱신 (6/6)"
```

- [ ] **Step 10: 병합 전 사용자 확인**

`main`에 병합하지 않는다. 다음을 사용자에게 보고한다:

1. 7종 × 라이트/다크 스크린샷
2. 빌드 시간 변화 (약 110초 → 실측치)
3. 첫 페이지 로드 자바스크립트 전송량 변화 (lunr 553KB + 130KB 제거)
4. 전체 테스트 결과
5. 알려진 미해결 항목 — giscus placeholder(댓글 미동작), GA placeholder, 자동 시각 회귀 부재

사용자 승인 후에만 `main`에 병합·푸시한다.

---

## Self-Review

**1. 스펙 커버리지**

| 스펙 항목 | 담당 태스크 |
|---|---|
| §1 셸 구조 · 레이아웃 4종 | Task 1(default·post), 2(page), 3(home) |
| §1 CONTENTS 레일 규칙 (h2 ≥ 2) | Task 1 Step 14 `buildToc` |
| §1 모바일 드로어 | Task 1 Step 12 미디어쿼리, Step 14 `wireDrawer` |
| §2 인덱스 · 지연 로드 · 매칭 · UI · 빈 상태 | Task 5 |
| §3 색상 규칙 · 검증 | Task 1(신규 파일), Task 4(전역 + 대응표) |
| §4 테마 3-상태 | Task 1 Steps 3~6 |
| §5 6단계 순서 | Task 1~6 |
| §6 테스트 3층 | jest(Task 1~6), vitest(Task 5), 브라우저(각 태스크 말미) |
| §7 리스크 — 기존 테스트 깨짐 | Task 6 Step 1 |
| §7 리스크 — `ui-text` 참조 | Task 6 Step 5 |
| 부수 변경 — JS 삭제, SVG 아이콘, 스크립트 목록 | Task 1 Step 15, Task 4 Step 5 |

누락 없음.

**2. 플레이스홀더 스캔**

"TBD", "적절히", "필요시 처리" 없음. 모든 코드 스텝에 실제 코드가 있다. Task 4 Step 4는 793줄 파일 해체라 전문을 싣는 대신 **분류 기준과 34종 색상 대응표**를 제공했다 — 기계적으로 수행 가능하고 테스트로 완료를 판정한다.

**3. 타입 일관성**

- `Doc` 필드 `{t,u,d,c,g,h,e,b}` — 스펙 §2, 제너레이터(Task 5 Step 5), 순수 함수(Step 3), 테스트(Step 1), 인덱스 단언(Step 10)에서 동일.
- `window.blogTheme.isDark()` — Task 1 Step 5에서 정의, Step 6에서 소비.
- `.theme-toggle` 클래스 — Task 1 Steps 5·8·9에서 일관.
- `.search-open-btn` — Task 5 Steps 7·9에서 일관.
- `#main` / `#contents-rail` / `#rail-toc` / `#rail-nav` — Task 1 Steps 9·10·14에서 일관.
- `_data/categories.yml` 스키마 `{title,url}` — Task 1 Step 7 정의, Step 9(레일)·Task 2 Step 7(푸터)에서 소비.
