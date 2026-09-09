import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const churchArticlesPath = path.join(webRoot, 'src', 'pages', 'public', 'churchArticles.ts');
const distIndexPath = path.join(webRoot, 'dist', 'index.html');
const metaJsonPath = path.join(webRoot, 'src', 'pages', 'public', 'articlesMeta.json');

if (!fs.existsSync(churchArticlesPath) || !fs.existsSync(distIndexPath)) {
  console.log('[generate-og-pages] Skipping: churchArticles.ts or dist/index.html not found.');
  process.exit(0);
}

const content = fs.readFileSync(churchArticlesPath, 'utf8');
const baseHtml = fs.readFileSync(distIndexPath, 'utf8');

// Parse articles
const articles = [];
const blocks = content.split(/\{\s*id:\s*"/g).slice(1);

for (const b of blocks) {
  const idMatch = b.match(/^([^"]+)"/);
  const titleMatch = b.match(/title:\s*"([^"]+)"/);
  const slugMatch = b.match(/slug:\s*"([^"]+)"/);
  const subtitleMatch = b.match(/subtitle:\s*"([^"]+)"/);
  const featuredImageMatch = b.match(/featuredImage:\s*"([^"]+)"/);
  const ogImageMatch = b.match(/ogImage:\s*"([^"]+)"/);
  const categoryLabelMatch = b.match(/categoryLabel:\s*"([^"]+)"/);

  if (idMatch && titleMatch && slugMatch) {
    let img = ogImageMatch ? ogImageMatch[1] : (featuredImageMatch ? featuredImageMatch[1] : "");
    if (img.startsWith('/')) {
      img = `https://epic-cms.vercel.app${img}`;
    }

    articles.push({
      id: idMatch[1],
      title: titleMatch[1],
      slug: slugMatch[1],
      subtitle: subtitleMatch ? subtitleMatch[1] : "",
      featuredImage: featuredImageMatch ? featuredImageMatch[1] : "",
      ogImage: img || "https://epic-cms.vercel.app/images/og/epic-main-tagline.jpg",
      categoryLabel: categoryLabelMatch ? categoryLabelMatch[1] : "CHURCH JOURNAL"
    });
  }
}

// Save articlesMeta.json
fs.writeFileSync(metaJsonPath, JSON.stringify(articles, null, 2), 'utf8');
console.log(`[generate-og-pages] Saved ${articles.length} articles metadata to ${metaJsonPath}`);

// Generate static HTML for each article
for (const art of articles) {
  const fullArticleUrl = `https://epic-cms.vercel.app/blog?article=${encodeURIComponent(art.slug)}`;
  const ogImg = art.ogImage.startsWith('/') ? `https://epic-cms.vercel.app${art.ogImage}` : art.ogImage;

  let articleHtml = baseHtml;

  // Replace Title
  articleHtml = articleHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${art.title} | EPIC Church</title>`
  );

  // Replace Description
  articleHtml = articleHtml.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${art.subtitle.replace(/"/g, '&quot;')}" />`
  );

  // Replace or inject OG Title
  if (/<meta\s+property="og:title"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${art.title.replace(/"/g, '&quot;')}" />`
    );
  }

  // Replace or inject OG Description
  if (/<meta\s+property="og:description"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${art.subtitle.replace(/"/g, '&quot;')}" />`
    );
  }

  // Replace or inject OG URL
  if (/<meta\s+property="og:url"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${fullArticleUrl}" />`
    );
  }

  // Replace or inject OG Type
  if (/<meta\s+property="og:type"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="article" />`
    );
  }

  // Replace or inject OG Image
  if (/<meta\s+property="og:image"\s+/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${ogImg}" />`
    );
  } else {
    articleHtml = articleHtml.replace(
      /<\/head>/i,
      `  <meta property="og:image" content="${ogImg}" />\n  <meta property="og:image:secure_url" content="${ogImg}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta property="og:image:type" content="image/jpeg" />\n</head>`
    );
  }

  if (/<meta\s+property="og:image:secure_url"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:secure_url" content="${ogImg}" />`
    );
  }

  if (/<meta\s+property="og:image:alt"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:alt" content="${art.title.replace(/"/g, '&quot;')}" />`
    );
  }

  // Replace Twitter Tags
  if (/<meta\s+name="twitter:title"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${art.title.replace(/"/g, '&quot;')}" />`
    );
  }

  if (/<meta\s+name="twitter:description"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${art.subtitle.replace(/"/g, '&quot;')}" />`
    );
  }

  if (/<meta\s+name="twitter:image"/i.test(articleHtml)) {
    articleHtml = articleHtml.replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${ogImg}" />`
    );
  } else {
    articleHtml = articleHtml.replace(
      /<\/head>/i,
      `  <meta name="twitter:image" content="${ogImg}" />\n</head>`
    );
  }

  // Inject initial article slug helper into head
  const headInject = `<script>window.__INITIAL_ARTICLE_SLUG__ = "${art.slug}";</script></head>`;
  articleHtml = articleHtml.replace(/<\/head>/i, headInject);

  // Output to dist/blog/${art.slug}/index.html
  const slugDir = path.join(webRoot, 'dist', 'blog', art.slug);
  fs.mkdirSync(slugDir, { recursive: true });
  fs.writeFileSync(path.join(slugDir, 'index.html'), articleHtml, 'utf8');

  // Also output to dist/blog/${art.id}/index.html if different
  if (art.id !== art.slug) {
    const idDir = path.join(webRoot, 'dist', 'blog', art.id);
    fs.mkdirSync(idDir, { recursive: true });
    fs.writeFileSync(path.join(idDir, 'index.html'), articleHtml, 'utf8');
  }
}

console.log(`[generate-og-pages] Successfully generated ${articles.length} static Open Graph article pages in dist/blog/`);
