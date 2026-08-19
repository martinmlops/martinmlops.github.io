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
