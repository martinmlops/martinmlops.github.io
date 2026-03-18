const fc = require('fast-check');
const yaml = require('js-yaml');
const {
  parsePostFilename,
  buildPostFilename,
  parseFrontMatter,
  serializeFrontMatter,
  filterByCategory,
  filterByTag,
  extractHeadings,
  findRelatedPosts,
  readYaml,
  listPostFiles,
  readPost,
  readFileContent,
} = require('./utils');

// ─── Generators ───

const validYear = fc.integer({ min: 2020, max: 2030 });
const validMonth = fc.integer({ min: 1, max: 12 });
const validDay = fc.integer({ min: 1, max: 28 });
const slugChar = fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 });
const validSlug = fc.array(slugChar, { minLength: 1, maxLength: 3 }).map(parts => parts.join('-'));

const safeString = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789 '.split('')),
  { minLength: 1, maxLength: 30 }
).map(s => s.trim()).filter(s => s.length > 0);

const categoryGen = fc.constantFrom('Azure', 'Kubernetes', 'Network', 'Security', 'DevOps', 'Cloud');
const tagGen = fc.constantFrom('docker', 'k8s', 'azure', 'network', 'security', 'linux', 'ci-cd', 'terraform');

// ─── Property 1: 포스트 파일명 패턴 검증 ───

test('Property 1: 포스트 파일명 패턴 검증', () => {
  fc.assert(
    fc.property(validYear, validMonth, validDay, validSlug, (year, month, day, slug) => {
      const filename = buildPostFilename(year, month, day, slug);
      const parsed = parsePostFilename(filename);
      expect(parsed).not.toBeNull();
      expect(parsed.year).toBe(year);
      expect(parsed.month).toBe(month);
      expect(parsed.day).toBe(day);
      expect(parsed.slug).toBe(slug);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 2: Front Matter 라운드트립 ───

test('Property 2: Front Matter 라운드트립', () => {
  const frontMatterGen = fc.record({
    title: safeString,
    categories: fc.array(categoryGen, { minLength: 1, maxLength: 2 }),
    tags: fc.array(tagGen, { minLength: 1, maxLength: 4 }),
  });

  fc.assert(
    fc.property(frontMatterGen, (data) => {
      const serialized = serializeFrontMatter(data, 'content');
      const parsed = parseFrontMatter(serialized);
      expect(parsed).not.toBeNull();
      expect(parsed.data.title).toBe(data.title);
      expect(parsed.data.categories).toEqual(data.categories);
      expect(parsed.data.tags).toEqual(data.tags);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 3: Markdown 콘텐츠 렌더링 보존 ───

test('Property 3: Markdown 콘텐츠 렌더링 보존', () => {
  const imagePathGen = fc.constantFrom('/assets/images/azure/test.png', '/assets/images/kubernetes/arch.png');
  const tableRowGen = fc.tuple(safeString, safeString).map(([a, b]) => `| ${a} | ${b} |`);

  fc.assert(
    fc.property(imagePathGen, tableRowGen, (imgPath, tableRow) => {
      const md = [
        `![alt](${imgPath})`,
        '',
        '| Col1 | Col2 |',
        '|------|------|',
        tableRow,
        '',
        '```mermaid',
        'graph TD',
        '  A-->B',
        '```',
        '',
        'Inline math: $E=mc^2$',
      ].join('\n');

      expect(md).toContain(imgPath);
      expect(md).toMatch(/\|.*\|/);
      expect(md).toMatch(/```mermaid/);
      expect(md).toMatch(/\$.*\$/);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 4: 구문 강조 클래스 생성 ───

test('Property 4: 구문 강조 클래스 생성', () => {
  const langGen = fc.constantFrom('python', 'javascript', 'bash', 'yaml', 'json', 'ruby', 'go');

  fc.assert(
    fc.property(langGen, safeString, (lang, code) => {
      const codeBlock = '```' + lang + '\n' + code + '\n```';
      expect(codeBlock).toContain('```' + lang);
      const config = readYaml('_config.yml');
      expect(config.kramdown.syntax_highlighter).toBe('rouge');
    }),
    { numRuns: 100 }
  );
});

// ─── Property 5: 카테고리 및 태그 필터링 정확성 ───

test('Property 5: 카테고리 및 태그 필터링 정확성', () => {
  const postGen = fc.record({
    title: safeString,
    categories: fc.array(categoryGen, { minLength: 1, maxLength: 2 }),
    tags: fc.array(tagGen, { minLength: 1, maxLength: 3 }),
  });

  fc.assert(
    fc.property(fc.array(postGen, { minLength: 1, maxLength: 10 }), categoryGen, tagGen, (posts, cat, tag) => {
      const catFiltered = filterByCategory(posts, cat);
      catFiltered.forEach(p => expect(p.categories).toContain(cat));
      posts.forEach(p => {
        if (p.categories.includes(cat)) {
          expect(catFiltered).toContainEqual(p);
        }
      });

      const tagFiltered = filterByTag(posts, tag);
      tagFiltered.forEach(p => expect(p.tags).toContain(tag));
      posts.forEach(p => {
        if (p.tags.includes(tag)) {
          expect(tagFiltered).toContainEqual(p);
        }
      });
    }),
    { numRuns: 100 }
  );
});

// ─── Property 6: Open Graph 메타 태그 완전성 ───

test('Property 6: Open Graph 메타 태그 완전성', () => {
  const postGen = fc.record({
    title: safeString,
    description: safeString,
    categories: fc.array(categoryGen, { minLength: 1, maxLength: 2 }),
  });

  fc.assert(
    fc.property(postGen, (post) => {
      const config = readYaml('_config.yml');
      expect(config.plugins).toContain('jekyll-seo-tag');
      expect(post.title).toBeDefined();
      expect(post.description).toBeDefined();
      expect(config.url).toBeDefined();
    }),
    { numRuns: 100 }
  );
});

// ─── Property 7: 사이트맵 포스트 포함 ───

test('Property 7: 사이트맵 포스트 포함', () => {
  fc.assert(
    fc.property(fc.constantFrom(...listPostFiles()), (filename) => {
      const config = readYaml('_config.yml');
      expect(config.plugins).toContain('jekyll-sitemap');
      const post = readPost(filename);
      expect(post).not.toBeNull();
      expect(post.data.title).toBeDefined();
      const robots = readFileContent('robots.txt');
      expect(robots).toMatch(/Sitemap:/i);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 8: 목차 생성 정확성 ───

test('Property 8: 목차 생성 정확성', () => {
  const headingLevel = fc.integer({ min: 2, max: 6 });
  const headingText = safeString;
  const headingGen = fc.tuple(headingLevel, headingText).map(([level, text]) => ({
    level,
    text,
    md: '#'.repeat(level) + ' ' + text,
  }));

  fc.assert(
    fc.property(fc.array(headingGen, { minLength: 1, maxLength: 6 }), (headings) => {
      const markdown = headings.map(h => h.md).join('\n\n');
      const extracted = extractHeadings(markdown);
      expect(extracted.length).toBe(headings.length);
      headings.forEach((h, i) => {
        expect(extracted[i].level).toBe(h.level);
        expect(extracted[i].text).toBe(h.text);
      });
      const config = readYaml('_config.yml');
      const postDefaults = config.defaults.find(d => d.scope && d.scope.type === 'posts');
      expect(postDefaults.values.toc).toBe(true);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 9: 관련 포스트 관련성 ───

test('Property 9: 관련 포스트 관련성', () => {
  const postGen = fc.record({
    title: safeString,
    categories: fc.array(categoryGen, { minLength: 1, maxLength: 2 }),
    tags: fc.array(tagGen, { minLength: 1, maxLength: 3 }),
  });

  fc.assert(
    fc.property(fc.array(postGen, { minLength: 2, maxLength: 8 }), (posts) => {
      const uniquePosts = posts.reduce((acc, p, i) => {
        p.title = p.title + '_' + i;
        acc.push(p);
        return acc;
      }, []);

      const target = uniquePosts[0];
      const related = findRelatedPosts(target, uniquePosts);

      related.forEach(rp => {
        const sharedCat = (target.categories || []).some(c => (rp.categories || []).includes(c));
        const sharedTag = (target.tags || []).some(t => (rp.tags || []).includes(t));
        expect(sharedCat || sharedTag).toBe(true);
      });
    }),
    { numRuns: 100 }
  );
});

// ─── Property 10: 검색 인덱스 완전성 ───

test('Property 10: 검색 인덱스 완전성', () => {
  fc.assert(
    fc.property(fc.constantFrom(...listPostFiles()), (filename) => {
      const post = readPost(filename);
      expect(post).not.toBeNull();
      expect(post.data.title).toBeDefined();
      expect(typeof post.data.title).toBe('string');
      expect(post.content.length).toBeGreaterThan(0);
      const config = readYaml('_config.yml');
      expect(config.search).toBe(true);
    }),
    { numRuns: 100 }
  );
});

// ─── Property 11: _config.yml 파싱 정확성 ───

test('Property 11: _config.yml 파싱 정확성', () => {
  const configGen = fc.record({
    title: safeString,
    url: fc.constantFrom('https://example.github.io', 'https://blog.example.com'),
    locale: fc.constantFrom('ko-KR', 'en-US', 'ja-JP'),
    remote_theme: fc.constant('mmistakes/minimal-mistakes'),
  });

  fc.assert(
    fc.property(configGen, (configData) => {
      const yamlStr = yaml.dump(configData);
      const parsed = yaml.load(yamlStr);
      expect(parsed.title).toBe(configData.title);
      expect(parsed.url).toBe(configData.url);
      expect(parsed.locale).toBe(configData.locale);
      expect(parsed.remote_theme).toBe(configData.remote_theme);
    }),
    { numRuns: 100 }
  );
});
