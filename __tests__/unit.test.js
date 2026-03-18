const {
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
  test('Gemfile contains Jekyll and minimal-mistakes theme', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/gem\s+["']jekyll["']/);
    expect(gemfile).toMatch(/minimal-mistakes-jekyll/);
  });

  test('Gemfile contains sitemap and seo-tag plugins', () => {
    const gemfile = readFileContent('Gemfile');
    expect(gemfile).toMatch(/jekyll-sitemap/);
    expect(gemfile).toMatch(/jekyll-seo-tag/);
  });

  test('_config.yml has required fields', () => {
    const config = readYaml('_config.yml');
    expect(config.title).toBeDefined();
    expect(config.url).toBeDefined();
    expect(config.remote_theme).toMatch(/minimal-mistakes/);
    expect(config.locale).toBe('ko-KR');
  });

  test('_config.yml has toc enabled in defaults', () => {
    const config = readYaml('_config.yml');
    const postDefaults = config.defaults.find(
      d => d.scope && d.scope.type === 'posts'
    );
    expect(postDefaults).toBeDefined();
    expect(postDefaults.values.toc).toBe(true);
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
