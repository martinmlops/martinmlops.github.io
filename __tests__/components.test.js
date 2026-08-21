const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ROOT, readFileContent, readYaml } = require('./utils');

// 이 스위트는 세미나 문서에 있던 블록 어휘 — 번호 카드 그리드 안의 원형
// 번호·모노 eyebrow·알파벳 목록, 섹션 위 모노 eyebrow, 고스트 넘버
// 풀블리드 섹션 — 가 실제로 컴파일된 CSS에 존재하고, 토큰 색 규칙을
// 지키는지 확인한다. 컴파일된 CSS를 검사하므로 앞서 `bundle exec jekyll
// build`를 한 번 실행해 `_site`를 최신 상태로 만든다.

const CSS_PATH = path.join(ROOT, '_site/assets/css/main.css');

beforeAll(() => {
  execSync('bundle exec jekyll build', { cwd: ROOT, stdio: 'pipe' });
}, 60000);

function compiledCss() {
  return fs.readFileSync(CSS_PATH, 'utf8');
}

// 선택자 하나의 규칙 블록만 잘라낸다 (중첩 없는 평범한 컴파일 결과 가정)
function ruleBlock(css, selectorRegex) {
  const m = css.match(selectorRegex);
  if (!m) return null;
  const start = m.index;
  const braceStart = css.indexOf('{', start);
  const braceEnd = css.indexOf('}', braceStart);
  return css.slice(start, braceEnd + 1);
}

describe('컴포넌트 어휘 — 번호 카드 그리드 (카드 내부 요소)', () => {
  test('.card-grid--3 가 컴파일된 CSS에 존재하고 3열 그리드를 정의한다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.card-grid\.card-grid--3\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/grid-template-columns:\s*repeat\(3,\s*1fr\)/);
  });

  test('.card-grid--3 가 좁은 화면에서 1열로 접힌다 (반응형)', () => {
    const scss = readFileContent('_sass/custom/_components.scss');
    const idx = scss.indexOf('card-grid--3');
    expect(idx).toBeGreaterThan(-1);
    const scoped = scss.slice(idx, idx + 400);
    expect(scoped).toMatch(/@media \(max-width:\s*768px\)\s*\{\s*grid-template-columns:\s*1fr/);
  });

  test('.card-num — 원형 번호 배지가 존재한다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.card-num\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/border-radius:\s*50%/);
  });

  test('.card-kicker — 카드 안 모노 eyebrow가 존재한다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.card-kicker\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(block).toMatch(/text-transform:\s*uppercase/);
  });

  test('.card-list — 알파벳(A/B/C) 채번 목록이 CSS 카운터로 구현돼 있다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.card-list\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/counter-reset:/);
    const beforeBlock = ruleBlock(css, /\.card-list li::before\s*\{/);
    expect(beforeBlock).not.toBeNull();
    expect(beforeBlock).toMatch(/counter\([^)]+,\s*upper-alpha\)/);
  });
});

describe('컴포넌트 어휘 — 모노 eyebrow (섹션용)', () => {
  test('.kicker 컨테이너가 존재한다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.kicker\s*\{/);
    expect(block).not.toBeNull();
  });

  test('.kicker-label 이 모노 + accent 토큰 색이다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.kicker-label\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(block).toMatch(/rgb\(var\(--accent\)\)/);
  });
});

describe('컴포넌트 어휘 — 고스트 넘버 풀블리드 섹션', () => {
  test('.ghost-block 이 존재하고 attr(data-n)으로 큰 배경 숫자를 그린다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.ghost-block::before\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/content:\s*attr\(data-n\)/);
  });

  test('.ghost-block 본문(h2/p)이 토큰 색을 반전해서 쓴다', () => {
    const css = compiledCss();
    const block = ruleBlock(css, /\.ghost-block\s*\{/);
    expect(block).not.toBeNull();
    expect(block).toMatch(/background:\s*rgb\(var\(--fg\)\)/);
    expect(block).toMatch(/color:\s*rgb\(var\(--bg\)\)/);
  });
});

describe('색 규칙 — 새 컴포넌트도 토큰만 쓴다', () => {
  test('_components.scss 안에서 새 블록에 hex 리터럴이 없다', () => {
    const scss = readFileContent('_sass/custom/_components.scss');
    const hex = scss.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    expect(hex).toEqual([]);
  });

  test('컴파일된 CSS에서 새 클래스들 주변에 하드코딩 rgb()/rgba()/hsl() 리터럴이 없다', () => {
    const css = compiledCss();
    ['.card-num', '.card-kicker', '.card-list', '.kicker', '.kicker-label', '.ghost-block']
      .forEach((sel) => {
        const escaped = sel.replace(/\./g, '\\.');
        const block = ruleBlock(css, new RegExp(`${escaped}[^{]*\\{`));
        expect(block).not.toBeNull();
        expect(block).not.toMatch(/rgba?\(\s*[\d.]|hsla?\(/);
      });
  });
});

describe('docs/ 는 빌드에서 계속 제외된다', () => {
  test('_config.yml exclude 목록에 docs가 있다', () => {
    const cfg = readYaml('_config.yml');
    expect(cfg.exclude).toContain('docs');
  });

  test('빌드된 _site 에 docs/components.md 유래 페이지가 없다', () => {
    const siteDocsPath = path.join(ROOT, '_site/docs');
    expect(fs.existsSync(siteDocsPath)).toBe(false);
    // components.md 어디에도 나타나지 않아야 한다 (예상치 못한 경로로 새는지 확인)
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : [p];
    });
    const siteFiles = walk(path.join(ROOT, '_site'));
    expect(siteFiles.some((f) => f.endsWith('components.html') || f.endsWith('components.md'))).toBe(false);
  });
});
