const fs = require('fs');
const path = require('path');
const { readYaml, readFileContent, parseFrontMatter } = require('./utils');

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

  test('레일 스크립트가 헤딩 스캔 범위를 .post-body로 제한한다 (홈 목록의 h2가 TOC로 잘못 잡히지 않도록)', () => {
    const js = readFileContent('assets/js/contents-rail.js');
    expect(js).toMatch(/querySelector\(["']\.post-body["']\)/);
    expect(js).not.toMatch(/main\.querySelectorAll\(\s*["']h2/);
  });

  test('[hidden] 속성이 전역에서 display:none으로 복원된다 (MM의 HTML5 shiv가 nav 등에 display:block을 걸어 덮어쓰는 문제 대응)', () => {
    const base = readFileContent('_sass/custom/_base.scss');
    expect(base).toMatch(/\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});

describe('레일 저자 블록', () => {
  test('레일이 site.author.avatar와 site.author.name을 참조한다 (사진이 다시 사라지는 회귀 방지)', () => {
    const html = readFileContent('_includes/contents-rail.html');
    expect(html).toMatch(/site\.author\.avatar/);
    expect(html).toMatch(/site\.author\.name/);
  });

  test('아바타 경로에 relative_url을 적용한다', () => {
    const html = readFileContent('_includes/contents-rail.html');
    expect(html).toMatch(/site\.author\.avatar\s*\|\s*relative_url/);
  });

  test('저자 블록이 Contents 레이블보다 앞에 온다', () => {
    const html = readFileContent('_includes/contents-rail.html');
    const authorIdx = html.indexOf('site.author.avatar');
    const contentsIdx = html.indexOf('rail-label');
    expect(authorIdx).toBeGreaterThan(-1);
    expect(contentsIdx).toBeGreaterThan(-1);
    expect(authorIdx).toBeLessThan(contentsIdx);
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

  test('body가 토큰에서 배경·글자색을 가져온다 (MM 흰 배경 위 다크 텍스트 방지)', () => {
    const base = readFileContent('_sass/custom/_base.scss');
    expect(base).toMatch(/body\s*\{[^}]*background-color:\s*rgb\(var\(--bg\)\)/s);
    expect(base).toMatch(/body\s*\{[^}]*color:\s*rgb\(var\(--fg\)\)/s);
  });
});

describe('색상 규칙 (신규 파일)', () => {
  const NEW_SCSS = ['_sass/custom/_shell.scss', '_sass/custom/_post.scss'];

  test.each(NEW_SCSS)('%s 에 hex 리터럴이 없다', (f) => {
    const hex = (readFileContent(f).match(/#[0-9a-fA-F]{3,8}\b/g) || []);
    expect(hex).toEqual([]);
  });
});

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

  test('tags.md는 프론트매터 외에 실제 본문을 가진다 (layout: tags 제거로 사라진 목록을 대체)', () => {
    const src = readFileContent('_pages/tags.md');
    const { content } = parseFrontMatter(src);
    expect(content.trim().length).toBeGreaterThan(0);
    expect(content).toMatch(/site\.tags/);
  });
});

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

describe('와이드 레이아웃 (Job 1: 전체 너비 사용)', () => {
  test('.layout의 기본 max-width가 넓어졌다 (1160px 좁은 캡 제거)', () => {
    const shell = readFileContent('_sass/custom/_shell.scss');
    const startIdx = shell.indexOf('.layout {');
    expect(startIdx).toBeGreaterThan(-1);
    const block = shell.slice(startIdx, shell.indexOf('}', startIdx) + 1);
    expect(block).toMatch(/max-width:\s*min\(/);
    expect(block).not.toMatch(/max-width:\s*1160px/);
  });

  test('.post-body에 좁은 46rem 측정 캡이 남아있지 않다', () => {
    const post = readFileContent('_sass/custom/_post.scss');
    expect(post).not.toMatch(/max-width:\s*46rem/);
  });
});

describe('레일 접기 (Job 2: 토글 + 컨텐츠 확장)', () => {
  test('.layout이 접힘 상태에서 grid-template-columns가 단일 1fr 컬럼으로 바뀐다', () => {
    const shell = readFileContent('_sass/custom/_shell.scss');
    expect(shell).toMatch(/html\.rail-collapsed\s+\.layout\s*\{[^}]*grid-template-columns:\s*0?rem?\s*1fr/s);
  });

  test('접힘 규칙이 기본 .layout 규칙 이후(또는 더 높은 특이성)로 존재해 이긴다', () => {
    const shell = readFileContent('_sass/custom/_shell.scss');
    const baseIdx = shell.indexOf('.layout {');
    const collapsedIdx = shell.indexOf('html.rail-collapsed .layout');
    expect(baseIdx).toBeGreaterThan(-1);
    expect(collapsedIdx).toBeGreaterThan(-1);
    expect(collapsedIdx).toBeGreaterThan(baseIdx);
  });

  test('site-header.html이 레일 토글 버튼(.rail-open)을 렌더링한다', () => {
    const html = readFileContent('_includes/site-header.html');
    expect(html).toMatch(/class="icon-btn rail-open"/);
    expect(html).toMatch(/aria-expanded=/);
    expect(html).toMatch(/aria-label=/);
  });

  test('.icon-btn.rail-open이 데스크톱 기본값에서도 보인다 (더 이상 항상 display:none이 아니다)', () => {
    const shell = readFileContent('_sass/custom/_shell.scss');
    // 1024px 미디어쿼리 밖(데스크톱 기본)에서 display:none으로 숨기는 규칙이 없어야 한다
    const beforeMobile = shell.split('@media (max-width: 1024px)')[0];
    expect(beforeMobile).not.toMatch(/\.icon-btn\.rail-open\s*\{[^}]*display:\s*none/s);
  });

  test('접힘 상태를 localStorage에서 읽어 첫 페인트 전에 적용한다 (FOUC 방지, 테마 스크립트와 동일한 패턴)', () => {
    const head = readFileContent('_includes/head/custom.html');
    expect(head).toMatch(/localStorage\.getItem\(["']rail-collapsed["']\)/);
    expect(head).toMatch(/classList\.add\(["']rail-collapsed["']\)/);
    // 기존 테마 스크립트 로직은 그대로 남아 있어야 한다
    expect(head).toMatch(/localStorage\.getItem\(["']theme["']\)/);
  });

  test('레일 토글 스크립트가 localStorage에 상태를 저장하고 데스크톱/모바일을 구분한다', () => {
    const js = readFileContent('assets/js/contents-rail.js');
    expect(js).toMatch(/localStorage\.setItem\(["']rail-collapsed["']/);
    expect(js).toMatch(/rail-collapsed/);
  });

  test('레일이 display:none이 아닌 방식으로 접혀 TOC DOM 노드가 파괴되지 않는다', () => {
    const shell = readFileContent('_sass/custom/_shell.scss');
    const collapsedRailRule = shell.match(/html\.rail-collapsed\s+\.rail\s*\{[^}]*\}/s);
    expect(collapsedRailRule).not.toBeNull();
    expect(collapsedRailRule[0]).not.toMatch(/display:\s*none/);
  });
});

describe('레일 접힘 localStorage 라운드트립 (jsdom 없이 vm으로 실제 스크립트를 실행)', () => {
  const vm = require('vm');

  function makeFakeElement(tag) {
    const classes = new Set();
    const attrs = {};
    const listeners = {};
    return {
      tagName: tag || 'DIV',
      _classes: classes,
      _attrs: attrs,
      _listeners: listeners,
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) { classes.delete(c); return false; }
            classes.add(c); return true;
          }
          if (force) classes.add(c); else classes.delete(c);
          return force;
        },
      },
      setAttribute: (k, v) => { attrs[k] = String(v); },
      getAttribute: (k) => (k in attrs ? attrs[k] : null),
      removeAttribute: (k) => { delete attrs[k]; },
      toggleAttribute: (k, force) => { if (force) attrs[k] = ''; else delete attrs[k]; return !!force; },
      hasAttribute: (k) => k in attrs,
      addEventListener: function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      querySelectorAll: () => [],
      querySelector: () => null,
    };
  }

  // contents-rail.js를 실제 DOM 대신 최소 스텁 위에서 그대로 실행하고,
  // 헤더의 .rail-open 버튼 클릭을 흉내내 localStorage 라운드트립을 검증한다.
  function runRailScript({ desktop } = { desktop: true }) {
    const src = readFileContent('assets/js/contents-rail.js');
    const store = {};
    const localStorageStub = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };

    const htmlEl = makeFakeElement('HTML');
    const mainEl = makeFakeElement('MAIN');
    const railEl = makeFakeElement('ASIDE');
    const tocEl = makeFakeElement('NAV');
    const navEl = makeFakeElement('NAV');
    const btnEl = makeFakeElement('BUTTON');
    const byId = { main: mainEl, 'contents-rail': railEl, 'rail-toc': tocEl, 'rail-nav': navEl };

    let domReady = null;
    const mql = { matches: desktop, addEventListener: () => {}, addListener: () => {} };

    const sandbox = {
      document: {
        documentElement: htmlEl,
        addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') domReady = fn; },
        getElementById: (id) => byId[id] || null,
        querySelectorAll: (sel) => (sel === '.rail-open' ? [btnEl] : []),
        querySelector: () => null,
        createElement: () => makeFakeElement('DIV'),
        createTextNode: (t) => ({ text: t }),
      },
      window: { matchMedia: () => mql, innerWidth: desktop ? 1400 : 800 },
      localStorage: localStorageStub,
      console,
      Set,
      Array,
    };
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox, { filename: 'contents-rail.js' });
    domReady();

    return {
      click: () => btnEl._listeners.click.forEach((fn) => fn()),
      store,
      htmlEl,
      railEl,
      btnEl,
    };
  }

  test('데스크톱에서 토글 버튼 클릭이 localStorage["rail-collapsed"]에 기록된다', () => {
    const page = runRailScript({ desktop: true });
    expect(page.store['rail-collapsed']).toBeUndefined();
    page.click();
    expect(page.store['rail-collapsed']).toBe('true');
    expect(page.htmlEl._classes.has('rail-collapsed')).toBe(true);
    page.click();
    expect(page.store['rail-collapsed']).toBe('false');
    expect(page.htmlEl._classes.has('rail-collapsed')).toBe(false);
  });

  test('버튼의 title이 aria-label과 함께 상태에 따라 갱신된다 (데스크톱: 접기/펼치기)', () => {
    const page = runRailScript({ desktop: true });
    expect(page.btnEl._attrs.title).toBe(page.btnEl._attrs['aria-label']);
    const before = page.btnEl._attrs.title;
    page.click();
    expect(page.btnEl._attrs.title).not.toBe(before);
    expect(page.btnEl._attrs.title).toBe(page.btnEl._attrs['aria-label']);
  });

  test('모바일 폭에서는 title/aria-label이 드로어 열기·닫기 문구로 갱신된다', () => {
    const page = runRailScript({ desktop: false });
    expect(page.btnEl._attrs['aria-label']).toMatch(/목차/);
    expect(page.btnEl._attrs.title).toBe(page.btnEl._attrs['aria-label']);
    page.click();
    expect(page.btnEl._attrs.title).toBe(page.btnEl._attrs['aria-label']);
  });

  test('쓰기 키와 head/custom.html의 프리페인트 읽기 키가 정확히 같다 (rail-collapsed)', () => {
    const js = readFileContent('assets/js/contents-rail.js');
    const head = readFileContent('_includes/head/custom.html');
    const writeKeyMatch = js.match(/localStorage\.setItem\(\s*["']([^"']+)["']/);
    const readKeyMatch = head.match(/localStorage\.getItem\(\s*["']([^"']+)["']\)\s*===\s*"true"/);
    expect(writeKeyMatch).not.toBeNull();
    expect(readKeyMatch).not.toBeNull();
    expect(writeKeyMatch[1]).toBe(readKeyMatch[1]);
    expect(writeKeyMatch[1]).toBe('rail-collapsed');
  });

  test('모바일 폭에서는 클릭이 드로어만 열고 rail-collapsed 키를 쓰지 않는다', () => {
    const page = runRailScript({ desktop: false });
    page.click();
    expect(page.store['rail-collapsed']).toBeUndefined();
    expect(page.railEl._classes.has('open')).toBe(true);
  });

  test('head/custom.html의 프리페인트 스크립트는 DOMContentLoaded가 아니라 즉시 실행되는 동기 스크립트다', () => {
    const head = readFileContent('_includes/head/custom.html');
    expect(head).not.toMatch(/DOMContentLoaded/);
    expect(head).toMatch(/\(function\s*\(\)\s*\{[\s\S]*rail-collapsed[\s\S]*\}\)\(\);/);
  });

  test('프리페인트 스크립트 추가 후에도 기존 테마 로직(localStorage theme)이 그대로 남아 있다', () => {
    const head = readFileContent('_includes/head/custom.html');
    expect(head).toMatch(/localStorage\.getItem\(["']theme["']\)/);
    expect(head).toMatch(/setAttribute\(["']data-theme["'],\s*t\)/);
  });
});

describe('본문 폭: 문장형 요소만 읽기 좋은 폭, 나머지는 컬럼 전체 폭 (프로즈 측정)', () => {
  const post = () => readFileContent('_sass/custom/_post.scss');

  test('.post-body 컨테이너 자체에는 여전히 캡이 없다 (캡은 컬럼이 아니라 안쪽 요소에 건다)', () => {
    expect(post()).not.toMatch(/\.post-body\s*\{[^}]*max-width/s);
  });

  test('문단·목록·인용·제목이 읽기 좋은 폭(약 42rem)으로 제한된다', () => {
    const src = post();
    const block = src.match(/\.post-body > p,[\s\S]*?\{[\s\S]*?\}/);
    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/\.post-body > p/);
    expect(block[0]).toMatch(/\.post-body > ul/);
    expect(block[0]).toMatch(/\.post-body > ol/);
    expect(block[0]).toMatch(/\.post-body > blockquote/);
    expect(block[0]).toMatch(/\.post-body > h1/);
    expect(block[0]).toMatch(/\.post-body > h6/);
    expect(block[0]).toMatch(/max-width:\s*42rem/);
  });

  test('단독 이미지로만 이루어진 문단(kramdown의 <p><img></p>)은 폭 제한에서 빠진다', () => {
    expect(post()).toMatch(/\.post-body > p:has\(img\)\s*\{[^}]*max-width:\s*none/s);
  });

  test('표는 컬럼 전체 폭을 쓰고, 컬럼보다 넓어지면 표 자체가 가로 스크롤된다', () => {
    const block = post().match(/\.post-body table\s*\{[^}]*\}/s);
    expect(block).not.toBeNull();
    expect(block[0]).toMatch(/overflow-x:\s*auto/);
  });

  test('page.html·post.html이 같은 .post-body 클래스를 공유해 같은 규칙을 받는다', () => {
    expect(readFileContent('_layouts/page.html')).toMatch(/class="post-body"/);
    expect(readFileContent('_layouts/post.html')).toMatch(/class="post-body"/);
  });

  test('home의 .post-list는 프로즈 폭 제한에 걸리지 않는다 (.post-body 스코프 밖)', () => {
    expect(readFileContent('_layouts/home.html')).not.toMatch(/post-body/);
  });
});

describe('이미지 캡션 문단 (kramdown이 <p><img><em>캡션</em></p>로 묶는 경우)', () => {
  const post = () => readFileContent('_sass/custom/_post.scss');

  test('이미지를 포함한 문단은 세로로 쌓인다 (이미지 먼저, 캡션은 아래)', () => {
    const src = post();
    const idx = src.indexOf('.post-body > p:has(img)');
    expect(idx).toBeGreaterThan(-1);
    const block = src.slice(idx, src.indexOf('}', src.indexOf('{', idx)) + 1);
    expect(block).toMatch(/display:\s*flex/);
    expect(block).toMatch(/flex-direction:\s*column/);
    expect(block).toMatch(/align-items:\s*flex-start/);
  });

  test('캡션(em)은 본문보다 작고 muted 색상이며 위쪽에 여백을 갖는다', () => {
    const src = post();
    const idx = src.indexOf('.post-body > p:has(img) em');
    expect(idx).toBeGreaterThan(-1);
    const block = src.slice(idx, src.indexOf('}', src.indexOf('{', idx)) + 1);
    expect(block).toMatch(/color:\s*rgb\(var\(--muted\)\)/);
    expect(block).toMatch(/font-size:\s*0\.\d+em/);
    expect(block).toMatch(/margin-top:/);
  });
});

describe('레일 토글 버튼 아이콘/접근성 (Defect 2: 햄버거 → 사이드 패널 아이콘)', () => {
  const header = () => readFileContent('_includes/site-header.html');

  test('버튼에 title 속성이 있다', () => {
    expect(header()).toMatch(/class="icon-btn rail-open"[^>]*title="[^"]+"/);
  });

  test('버튼 아이콘이 사이드 패널(좌측 분할 사각형) 모양이다 (더 이상 3줄 햄버거가 아니다)', () => {
    const html = header();
    const btnIdx = html.indexOf('rail-open');
    const svgBlock = html.slice(btnIdx, html.indexOf('</svg>', btnIdx));
    // 예전 햄버거 3줄 패턴(M2 4h12M2 8h12M2 12h8)이 사라지고
    // 사각형 + 분할선(rect/line 형태)으로 바뀐다
    expect(svgBlock).not.toMatch(/M2 4h12M2 8h12M2 12h8/);
    expect(svgBlock).toMatch(/<rect/);
  });

  test('aria-label이 한국어이며 aria-expanded와 함께 쓰인다', () => {
    const html = header();
    expect(html).toMatch(/class="icon-btn rail-open"[\s\S]*?aria-label="[가-힣]/);
    expect(html).toMatch(/class="icon-btn rail-open"[\s\S]*?aria-expanded="(true|false)"/);
  });
});

