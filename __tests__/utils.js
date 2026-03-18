const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');

/**
 * Parse a Jekyll post filename into its date and slug components.
 * Expected format: YYYY-MM-DD-kebab-case-title.md
 * Returns { year, month, day, slug } or null if invalid.
 */
function parsePostFilename(filename) {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
  if (!match) return null;
  const [, year, month, day, slug] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m, day: d, slug };
}

/**
 * Build a Jekyll post filename from components.
 */
function buildPostFilename(year, month, day, slug) {
  const yy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yy}-${mm}-${dd}-${slug}.md`;
}

/**
 * Parse YAML front matter from a markdown string.
 * Returns { data, content } where data is the parsed YAML object.
 */
function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  try {
    const data = yaml.load(match[1]);
    return { data, content: match[2] };
  } catch {
    return null;
  }
}

/**
 * Serialize front matter data to a YAML front matter string.
 */
function serializeFrontMatter(data, content = '') {
  const yamlStr = yaml.dump(data, { lineWidth: -1 });
  return `---\n${yamlStr}---\n${content}`;
}

/**
 * Filter posts by category. A post matches if its categories array
 * includes the given category string.
 */
function filterByCategory(posts, category) {
  return posts.filter(p => p.categories && p.categories.includes(category));
}

/**
 * Filter posts by tag.
 */
function filterByTag(posts, tag) {
  return posts.filter(p => p.tags && p.tags.includes(tag));
}

/**
 * Read and parse a YAML file from the workspace root.
 */
function readYaml(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return yaml.load(content);
}

/**
 * Read a file from the workspace root.
 */
function readFileContent(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * List post files in _posts/ directory.
 */
function listPostFiles() {
  const postsDir = path.join(ROOT, '_posts');
  return fs.readdirSync(postsDir).filter(f => f.endsWith('.md') && f !== '.gitkeep');
}

/**
 * Read and parse a post file, returning its front matter data and content.
 */
function readPost(filename) {
  const content = readFileContent(path.join('_posts', filename));
  return parseFrontMatter(content);
}

/**
 * Generate TOC entries from markdown headings (h2-h6).
 */
function extractHeadings(markdown) {
  const lines = markdown.split('\n');
  const headings = [];
  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.+)$/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
  }
  return headings;
}

/**
 * Find related posts that share at least one category or tag.
 */
function findRelatedPosts(targetPost, allPosts) {
  return allPosts.filter(p => {
    if (p.title === targetPost.title) return false;
    const sharedCat = (targetPost.categories || []).some(c => (p.categories || []).includes(c));
    const sharedTag = (targetPost.tags || []).some(t => (p.tags || []).includes(t));
    return sharedCat || sharedTag;
  });
}

module.exports = {
  ROOT,
  parsePostFilename,
  buildPostFilename,
  parseFrontMatter,
  serializeFrontMatter,
  filterByCategory,
  filterByTag,
  readYaml,
  readFileContent,
  listPostFiles,
  readPost,
  extractHeadings,
  findRelatedPosts,
};
