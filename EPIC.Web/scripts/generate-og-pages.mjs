// Build-Time Static Prerenderer for Open Graph & SEO Pages
// Runs automatically after 'vite build' to create static HTML folders for all articles.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const metaPath = path.join(rootDir, 'src/pages/public/articlesMeta.json');

const BASE_URL = 'https://epic-cms.vercel.app';
const FB_APP_ID = '966242223397117';

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

if (!fs.existsSync(metaPath)) {
  console.error('Error: articlesMeta.json not found at', metaPath);
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf-8');
const articles = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

console.log(`Generating Open Graph pre-rendered pages for ${articles.length} articles...`);

for (const article of articles) {
  const articleDir = path.join(distDir, 'blog', article.slug);
  fs.mkdirSync(articleDir, { recursive: true });

  const title = `${article.title} | EPIC Church`;
  const description = article.subtitle;
  const image = article.ogImage.startsWith('http') 
    ? article.ogImage 
    : `${BASE_URL}${article.ogImage.startsWith('/') ? '' : '/'}${article.ogImage}`;
  const canonicalUrl = `${BASE_URL}/blog/${encodeURIComponent(article.slug)}`;

  let html = template;

  // Replace Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace Open Graph Tags
  html = html.replace(/<meta property="og:title" content="[\s\S]*?" \/>/i, `<meta property="og:title" content="${escapeHtml(article.title)}" />`);
  html = html.replace(/<meta property="og:description" content="[\s\S]*?" \/>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:image" content="[\s\S]*?" \/>/i, `<meta property="og:image" content="${image}" />`);
  html = html.replace(/<meta property="og:image:secure_url" content="[\s\S]*?" \/>/i, `<meta property="og:image:secure_url" content="${image}" />`);
  html = html.replace(/<meta property="og:url" content="[\s\S]*?" \/>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<link rel="canonical" href="[\s\S]*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

  // Replace Twitter Cards
  html = html.replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/i, `<meta name="twitter:title" content="${escapeHtml(article.title)}" />`);
  html = html.replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="twitter:image" content="[\s\S]*?" \/>/i, `<meta name="twitter:image" content="${image}" />`);

  const outPath = path.join(articleDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf-8');
}

// Also generate dist/blog/index.html for the main blog magazine view
const blogDir = path.join(distDir, 'blog');
fs.mkdirSync(blogDir, { recursive: true });
const blogTitle = 'EPIC Church Journal & Pastoral Insights | Faith, Leadership & Discipleship';
const blogDesc = 'Biblical insights, pastoral care, marriage and family guidance, youth revival, and church leadership articles.';
const blogImage = `${BASE_URL}/images/og/epic-main-tagline.jpg`;
const blogUrl = `${BASE_URL}/blog`;

let blogHtml = template;
blogHtml = blogHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(blogTitle)}</title>`);
blogHtml = blogHtml.replace(/<meta property="og:title" content="[\s\S]*?" \/>/i, `<meta property="og:title" content="${escapeHtml(blogTitle)}" />`);
blogHtml = blogHtml.replace(/<meta property="og:description" content="[\s\S]*?" \/>/i, `<meta property="og:description" content="${escapeHtml(blogDesc)}" />`);
blogHtml = blogHtml.replace(/<meta property="og:image" content="[\s\S]*?" \/>/i, `<meta property="og:image" content="${blogImage}" />`);
blogHtml = blogHtml.replace(/<meta property="og:image:secure_url" content="[\s\S]*?" \/>/i, `<meta property="og:image:secure_url" content="${blogImage}" />`);
blogHtml = blogHtml.replace(/<meta property="og:url" content="[\s\S]*?" \/>/i, `<meta property="og:url" content="${blogUrl}" />`);
blogHtml = blogHtml.replace(/<link rel="canonical" href="[\s\S]*?" \/>/i, `<link rel="canonical" href="${blogUrl}" />`);
fs.writeFileSync(path.join(blogDir, 'index.html'), blogHtml, 'utf-8');

console.log(`Successfully generated static OG pages for ${articles.length} articles and /blog.`);

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
