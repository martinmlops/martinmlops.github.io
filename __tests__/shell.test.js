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
