const fs = require('fs');
const path = require('path');
const {
  ROOT,
  readYaml,
  readFileContent,
  listPostFiles,
  readPost,
  parsePostFilename,
  parseFrontMatter,
  filterByCategory,
} = require('./utils');

// ─── Jekyll 설정 확인 ───

describe('Jekyll Configuration', () => {
  test('Gemfile은 jekyll을 쓰되 원격 테마 플러그인은 쓰지 않는다', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/gem\s+["']jekyll["']/);
    // 테마를 직접 갖게 되면서 jekyll-remote-theme 의존을 끊었다
    expect(gemfile).not.toMatch(/jekyll-remote-theme/);
    // 검색 인덱스 생성에 쓰는 nokogiri는 남아 있어야 한다
    expect(gemfile).toMatch(/gem\s+["']nokogiri["']/);
  });

  test('Gemfile contains sitemap and seo-tag plugins', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/jekyll-sitemap/);
    expect(gemfile).toMatch(/jekyll-seo-tag/);
  });

  test('Gemfile의 group :jekyll_plugins 구조가 그대로 남아 있다', () => {
    const gemfile = readFileContent('Gemfile');
    const group = gemfile.match(/group :jekyll_plugins do([\s\S]*?)\nend/);
    expect(group).not.toBeNull();
    ['jekyll-sitemap', 'jekyll-seo-tag', 'jekyll-feed',
     'jekyll-paginate', 'jekyll-include-cache'].forEach((g) => {
      expect(group[1]).toContain(g);
    });
  });

  test('_config.yml has required fields', () => {
    const config = readYaml('_config.yml');
    expect(config.title).toBeDefined();
    expect(config.url).toBeDefined();
    expect(config.locale).toBe('ko-KR');
  });

  test('_config.yml에 minimal-mistakes 설정이 남아 있지 않다', () => {
    const config = readYaml('_config.yml');
    expect(config.remote_theme).toBeUndefined();
    expect(config.minimal_mistakes_skin).toBeUndefined();
    expect(config.theme).toBeUndefined();
    expect(config.plugins).not.toContain('jekyll-remote-theme');
    // 테마 liquid 아카이브 제너레이터 전용 키
    expect(config.category_archive).toBeUndefined();
    expect(config.tag_archive).toBeUndefined();
  });

  test('목차는 defaults의 toc 플래그가 아니라 클라이언트 스크립트가 만든다', () => {
    const config = readYaml('_config.yml');
    const postDefaults = config.defaults.find(
      d => d.scope && d.scope.type === 'posts'
    );
    expect(postDefaults).toBeDefined();
    // 테마 레이아웃만 읽던 플래그들은 사라졌다
    ['toc', 'toc_sticky', 'author_profile', 'share', 'related'].forEach((k) => {
      expect(postDefaults.values[k]).toBeUndefined();
    });
    // 실제로 목차를 만드는 경로가 살아 있는지 확인한다
    expect(config.after_footer_scripts).toContain('/assets/js/contents-rail.js');
    expect(readFileContent('_includes/contents-rail.html')).toMatch(/id="rail-toc"/);
    expect(readFileContent('assets/js/contents-rail.js')).toMatch(/rail-toc/);
    // post.html이 읽는 플래그는 남아 있어야 한다
    expect(postDefaults.values.read_time).toBe(true);
    expect(postDefaults.values.layout).toBe('post');
  });
});

// ─── minimal-mistakes 제거 확인 ───

describe('minimal-mistakes 제거', () => {
  test('assets/css/main.scss가 테마 스킨/본체를 import하지 않는다', () => {
    const scss = readFileContent('assets/css/main.scss');
    expect(scss).not.toMatch(/@import\s+["']minimal-mistakes/);
    expect(scss).not.toMatch(/minimal_mistakes_skin/);
    // 자체 디자인 시스템은 그대로 로드된다
    ['tokens', 'base', 'components', 'shell', 'post'].forEach((p) => {
      expect(scss).toMatch(new RegExp(`@import\\s+["']custom/${p}["']`));
    });
  });

  test('테마 DOM을 겨냥하던 _sass/custom/_layout.scss가 사라졌다', () => {
    expect(fs.existsSync(path.join(ROOT, '_sass/custom/_layout.scss'))).toBe(false);
    expect(readFileContent('assets/css/main.scss')).not.toMatch(/custom\/layout/);
  });

  test('_includes에는 셸이 실제로 include하는 파일만 남아 있다', () => {
    const present = fs.readdirSync(path.join(ROOT, '_includes'))
      .filter((f) => f.endsWith('.html')).sort();
    expect(present).toEqual([
      'contents-rail.html', 'footer.html', 'search-overlay.html', 'site-header.html',
    ]);
    ['masthead.html', 'sidebar.html', 'sidebar-custom.html',
     'author-profile.html', 'author-profile-custom-links.html'].forEach((f) => {
      expect(fs.existsSync(path.join(ROOT, '_includes', f))).toBe(false);
    });
  });

  test('assets/js의 모든 파일이 after_footer_scripts에서 로드된다', () => {
    const config = readYaml('_config.yml');
    const loaded = new Set(config.after_footer_scripts);
    const jsFiles = fs.readdirSync(path.join(ROOT, 'assets/js')).filter((f) => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);
    jsFiles.forEach((f) => expect(loaded.has(`/assets/js/${f}`)).toBe(true));
  });

  test('스타일시트가 이제 테마 마크업용 선택자를 만들지 않는다', () => {
    const files = fs.readdirSync(path.join(ROOT, '_sass/custom'))
      .map((f) => readFileContent(path.join('_sass/custom', f))).join('\n');
    // .page__footer-inner / -copyright 는 우리 footer.html이 직접 찍는
    // 살아있는 클래스라 제외한다.
    [/\.masthead\b/, /\.greedy-nav\b/, /\.sidebar\b/, /\.author__/,
     /\.page__content\s*[{,]/, /\.archive__/, /\.page__footer\s*[{,]/,
     /\.search-content\b/, /\.btn--/, /html\.dark-mode/].forEach((re) => {
      expect(files).not.toMatch(re);
    });
  });
});

// ─── 카테고리 존재 확인 ───

describe('Categories', () => {
  test('Posts cover Azure, Kubernetes, Network, Security categories', () => {
    const posts = listPostFiles().map(f => readPost(f).data);
    const allCategories = posts.flatMap(p => p.categories || []);
    expect(allCategories).toContain('Azure');
    expect(allCategories).toContain('Kubernetes');
    expect(allCategories).toContain('Network');
    expect(allCategories).toContain('Security');
  });

  test('Category filtering returns only matching posts', () => {
    const posts = listPostFiles().map(f => readPost(f).data);
    const azurePosts = filterByCategory(posts, 'Azure');
    azurePosts.forEach(p => {
      expect(p.categories).toContain('Azure');
    });
    expect(azurePosts.length).toBeGreaterThan(0);
  });
});

// ─── GitHub Actions 워크플로우 검증 ───

describe('GitHub Actions Workflow', () => {
  test('Workflow triggers on main branch push', () => {
    const wf = readYaml('.github/workflows/pages-deploy.yml');
    expect(wf.on.push.branches).toContain('main');
  });

  test('Workflow has workflow_dispatch trigger', () => {
    const wf = readYaml('.github/workflows/pages-deploy.yml');
    expect(wf.on).toHaveProperty('workflow_dispatch');
  });

  test('Workflow defines build and deploy jobs', () => {
    const wf = readYaml('.github/workflows/pages-deploy.yml');
    expect(wf.jobs).toHaveProperty('build');
    expect(wf.jobs).toHaveProperty('deploy');
  });

  test('Workflow has correct permissions', () => {
    const wf = readYaml('.github/workflows/pages-deploy.yml');
    expect(wf.permissions.contents).toBe('read');
    expect(wf.permissions.pages).toBe('write');
    expect(wf.permissions['id-token']).toBe('write');
  });
});

// ─── robots.txt 및 sitemap 검증 ───

describe('SEO Files', () => {
  test('robots.txt exists and contains Sitemap reference', () => {
    const robots = readFileContent('robots.txt');
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).toMatch(/Sitemap:/i);
  });

  test('robots.txt allows all crawling', () => {
    const robots = readFileContent('robots.txt');
    expect(robots).toMatch(/Allow:\s*\//);
  });
});

// ─── Giscus 및 GA 설정 검증 ───

describe('Comments and Analytics', () => {
  test('_config.yml has Giscus comment settings', () => {
    const config = readYaml('_config.yml');
    expect(config.comments).toBeDefined();
    expect(config.comments.provider).toBe('giscus');
    expect(config.comments.giscus).toBeDefined();
  });

  test('_config.yml has Google Analytics settings', () => {
    const config = readYaml('_config.yml');
    expect(config.analytics).toBeDefined();
    expect(config.analytics.google).toBeDefined();
  });
});

// ─── Front Matter 오류 처리 ───

describe('Error Handling', () => {
  test('Invalid YAML front matter returns null', () => {
    const invalid = '---\ntitle: [unclosed\n---\ncontent';
    const result = parseFrontMatter(invalid);
    expect(result).toBeNull();
  });

  test('Missing front matter delimiters returns null', () => {
    const noFm = 'Just some content without front matter';
    const result = parseFrontMatter(noFm);
    expect(result).toBeNull();
  });

  test('Invalid date in filename is detected', () => {
    const bad1 = parsePostFilename('2024-13-01-bad-month.md');
    expect(bad1).toBeNull();
    const bad2 = parsePostFilename('2024-01-32-bad-day.md');
    expect(bad2).toBeNull();
    const bad3 = parsePostFilename('not-a-date-title.md');
    expect(bad3).toBeNull();
  });

  test('All existing posts have valid filenames', () => {
    const files = listPostFiles();
    files.forEach(f => {
      const parsed = parsePostFilename(f);
      expect(parsed).not.toBeNull();
    });
  });

  test('All existing posts have valid front matter', () => {
    const files = listPostFiles();
    files.forEach(f => {
      const post = readPost(f);
      expect(post).not.toBeNull();
      expect(post.data.title).toBeDefined();
      expect(post.data.date).toBeDefined();
      expect(post.data.categories).toBeDefined();
    });
  });
});
