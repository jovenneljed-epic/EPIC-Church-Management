// Vercel Serverless Function: Open Graph Meta Tag Generator for Social Media Crawlers
// Automatically generates high-impact Open Graph and Twitter Card tags for present and future articles.

import articlesMeta from '../src/pages/public/articlesMeta.json' with { type: 'json' };

const BASE_URL = 'https://epic-cms.vercel.app';
const DEFAULT_IMAGE = `${BASE_URL}/images/og/epic-main-tagline.jpg`;
const FB_APP_ID = '966242223397117';

export default async function handler(req, res) {
  try {
    const parsedUrl = new URL(req.url, BASE_URL);
    let slug = parsedUrl.searchParams.get('article') || 
               parsedUrl.searchParams.get('slug') || 
               req.query?.article || 
               req.query?.slug || 
               '';

    // If path is like /blog/some-slug or /articles/some-slug
    if (!slug) {
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && (pathParts[0] === 'blog' || pathParts[0] === 'articles')) {
        slug = pathParts[1];
      }
    }

    let article = null;
    if (slug) {
      article = articlesMeta.find(a => a.slug === slug || a.id === slug);
    }

    // Dynamic fallback for future articles created via CMS/API
    let title, subtitle, image, targetUrl;
    if (article) {
      title = article.title;
      subtitle = article.subtitle;
      image = article.ogImage.startsWith('http') 
        ? article.ogImage 
        : `${BASE_URL}${article.ogImage.startsWith('/') ? '' : '/'}${article.ogImage}`;
      targetUrl = `${BASE_URL}/blog/${encodeURIComponent(article.slug)}`;
    } else if (slug) {
      // Future article created via CMS or external source
      const customTitle = parsedUrl.searchParams.get('title') || req.query?.title;
      const customDesc = parsedUrl.searchParams.get('desc') || req.query?.desc;
      const customImg = parsedUrl.searchParams.get('img') || req.query?.img;

      if (customTitle) {
        title = `${customTitle} | EPIC Church Journal`;
      } else {
        const formattedTitle = slug
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        title = `${formattedTitle} | EPIC Church Journal`;
      }

      subtitle = customDesc || "Read this biblical insight, church leadership reflection, and spiritual encouragement on EPIC Church.";
      image = customImg || DEFAULT_IMAGE;
      targetUrl = `${BASE_URL}/blog/${encodeURIComponent(slug)}`;
    } else {
      // Main site root
      title = "EPIC Church Management System | Modern Ministry & Christian Growth";
      subtitle = "Empowering Ministry, Pastoral Care, and Kingdom Discipleship. Modern church administration, QR attendance, online giving, cell groups, and Christian learning.";
      image = DEFAULT_IMAGE;
      targetUrl = BASE_URL;
    }

    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# article: https://ogp.me/ns/article#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(subtitle)}">
  <link rel="canonical" href="${targetUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="fb:app_id" content="${FB_APP_ID}">
  <meta property="og:type" content="${slug ? 'article' : 'website'}">
  <meta property="og:url" content="${targetUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(subtitle)}">
  <meta property="og:site_name" content="EPIC Church Journal &amp; Insights">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${targetUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(subtitle)}">
  <meta name="twitter:image" content="${image}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "${slug ? 'Article' : 'WebSite'}",
    "headline": "${escapeJson(title)}",
    "description": "${escapeJson(subtitle)}",
    "image": ["${image}"],
    "url": "${targetUrl}",
    "publisher": {
      "@type": "Organization",
      "name": "EPIC Church Journal & Insights",
      "url": "${BASE_URL}"
    }
  }
  </script>
</head>
<body style="margin:0;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;background:#0b1020;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:80vh;">
  <div style="max-width:680px;background:#131d38;border:1px solid #1e293b;border-radius:16px;padding:32px;box-shadow:0 20px 40px rgba(0,0,0,0.5);text-align:center;">
    <img src="${image}" alt="${escapeHtml(title)}" style="width:100%;height:auto;border-radius:12px;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,0.4);" />
    <h1 style="font-size:1.5rem;line-height:1.3;margin:0 0 12px 0;color:#f8fafc;">${escapeHtml(title)}</h1>
    <p style="font-size:0.95rem;line-height:1.6;color:#94a3b8;margin:0 0 24px 0;">${escapeHtml(subtitle)}</p>
    <a href="${targetUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2563eb,#38bdf8);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:0.95rem;box-shadow:0 4px 14px rgba(37,99,235,0.4);">Read Full Article on EPIC Church →</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('OG Handler error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html><html><head><title>EPIC Church</title></head><body><p>Redirecting to EPIC Church...</p><script>window.location.href="${BASE_URL}";</script></body></html>`);
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJson(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
