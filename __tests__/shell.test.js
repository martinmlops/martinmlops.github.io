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
