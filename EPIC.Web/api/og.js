// Vercel Serverless Function to serve dynamic Open Graph tags for Facebook, Messenger, Twitter, LinkedIn
export default function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'epic-cms.vercel.app'}`);
  
  // Extract article slug from query param or path
  let articleSlug = url.searchParams.get('article') || url.searchParams.get('slug');
  const pathParam = url.searchParams.get('path') || url.pathname;

  if (!articleSlug && pathParam) {
    const cleanPath = pathParam.replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/');
    if (segments[0] === 'blog' && segments[1]) {
      articleSlug = segments[1];
    } else if (segments.length === 1 && segments[0] !== 'blog') {
      articleSlug = segments[0];
    }
  }

  // Known Articles Database
  const articles = [
    {
      id: "art-death-pastors-wife-documentary",
      slug: "lessons-death-of-a-pastors-wife-documentary-spiritual-abuse-church-accountability",
      title: "When Tragedy Strikes the Parsonage: Reflections on the 'Death of a Pastor's Wife' Documentary, Spiritual Abuse, and Church Accountability",
      subtitle: "A biblically grounded investigation into the Mica Miller tragedy, the hidden isolation of ministry wives, coercive control in the name of God, and the non-negotiable mandate for independent elder boards.",
      ogImage: "https://epic-cms.vercel.app/images/og/pastors-wife-documentary-tagline.jpg"
    },
    {
      id: "art-celebrity-pastor-scandals-accountability",
      slug: "guarding-the-sacred-trust-dismantling-celebrity-pastor-culture",
      title: "Guarding the Sacred Trust: Dismantling the 'Celebrity Pastor' Culture & Restoring Biblical Integrity",
      subtitle: "From high-profile resignations to financial opacity: Why the New Testament model of servant elder plurality must replace modern church personality cults.",
      ogImage: "https://epic-cms.vercel.app/images/og/celebrity-pastor-tagline.jpg"
    },
    {
      id: "art-parsonage-burnout-prevention",
      slug: "the-silent-parsonage-crisis-warning-signs-pastoral-burnout",
      title: "The Silent Parsonage Crisis: 5 Warning Signs of Pastoral Burnout & How Congregations Can Protect Their Leaders",
      subtitle: "Behind the Sunday smiles: How churches can provide mandatory sabbaticals, confidential counseling, and emotional safety nets for pastors and their families.",
      ogImage: "https://epic-cms.vercel.app/images/og/pastoral-burnout-tagline.jpg"
    },
    {
      id: "art-5-ways-family-faith",
      slug: "5-ways-to-strengthen-your-family-faith",
      title: "5 Ways to Strengthen Your Family's Faith at Home",
      subtitle: "Practical ways Christian families can build stronger spiritual habits together.",
      ogImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-tithing-grace",
      slug: "is-tithing-still-relevant-today",
      title: "Is Tithing Still Relevant Today? Grace, Giving, and God's Economy",
      subtitle: "Understanding New Covenant generosity, overcoming financial fear, and honoring God with firstfruits.",
      ogImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-ministry-teams",
      slug: "building-strong-ministry-teams",
      title: "Building Strong Ministry Teams: Moving from Burnout to Delegation",
      subtitle: "The Jethro principle of tiered leadership, empowering lay coordinators, and creating healthy redundancy.",
      ogImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-early-prayer",
      slug: "power-of-4am-corporate-prayer",
      title: "The Power of 4:00 AM Corporate Prayer: When Ordinary Believers Seek God",
      subtitle: "Why historical awakenings started before dawn and how early morning intercession unlocks supernatural breakthrough.",
      ogImage: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-reaching-gen-z",
      slug: "why-young-people-are-hungry-for-real-faith",
      title: "Why Young People Are Hungry for Real Faith: Reaching Generation Z for Christ",
      subtitle: "Debunking the myth of shallow entertainment; the hunger for holiness, authentic mentors, and radical truth.",
      ogImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-unbroken-worship",
      slug: "beyond-sunday-music-unbroken-worship",
      title: "Beyond Sunday Music: Developing a Lifestyle of Unbroken Worship",
      subtitle: "Worship as a 24/7 sacrifice of daily choices, marketplace integrity, and secret prayer.",
      ogImage: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-mental-health-pastor",
      slug: "anxiety-depression-and-grace-of-god",
      title: "Anxiety, Depression, and the Grace of God: What Pastors Need to Know",
      subtitle: "Elijah under the broom tree, removing spiritual stigma, and providing compassionate pastoral intake.",
      ogImage: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-dinner-table-evangelism",
      slug: "art-of-hospitality-dinner-table-evangelism",
      title: "The Art of Hospitality: How Ordinary Dinners Lead to Extraordinary Salvations",
      subtitle: "Jesus at the dinner table, breaking down defensive walls, and turning strangers into family.",
      ogImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-discipleship-stages",
      slug: "from-sunday-attendee-to-spiritual-reproducer",
      title: "From Sunday Attendee to Spiritual Reproducer: The 4 Stages of Discipleship",
      subtitle: "Moving from crowd to convert, to servant-worker, to spiritual father and mother.",
      ogImage: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "art-digital-discipleship",
      slug: "digital-discipleship-technology-ministry",
      title: "Digital Discipleship: Using Technology to Expand the Kingdom Without Losing the Heart",
      subtitle: "How QR attendance, online giving, and digital LMS courses liberate pastors to focus on people and pastoral care.",
      ogImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  let matchedArticle = null;
  if (articleSlug) {
    matchedArticle = articles.find(a => a.slug === articleSlug || a.id === articleSlug);
  }

  const title = matchedArticle 
    ? matchedArticle.title 
    : "EPIC Church Management System | Empowering Ministry & Pastoral Care";
  
  const description = matchedArticle 
    ? matchedArticle.subtitle 
    : "Empowering Ministry, Pastoral Care, and Kingdom Discipleship. Modern church administration, QR attendance, online giving, cell groups, and Christian learning.";
  
  const image = matchedArticle 
    ? matchedArticle.ogImage 
    : "https://epic-cms.vercel.app/images/og/epic-main-tagline.jpg";

  const targetUrl = matchedArticle 
    ? `https://epic-cms.vercel.app/blog?article=${encodeURIComponent(matchedArticle.slug)}` 
    : "https://epic-cms.vercel.app/";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${matchedArticle ? 'article' : 'website'}">
  <meta property="og:site_name" content="EPIC Church Management System">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:url" content="${targetUrl}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">

  <!-- Instant Client Redirect -->
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <script>window.location.replace("${targetUrl}");</script>
</head>
<body style="background:#0b1020;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;">
  <div style="max-width:700px;margin:0 auto;">
    <h1 style="font-size:1.75rem;margin-bottom:16px;">${escapeHtml(title)}</h1>
    <p style="color:#94a3b8;line-height:1.6;margin-bottom:24px;">${escapeHtml(description)}</p>
    <img src="${image}" alt="${escapeHtml(title)}" style="max-width:100%;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);margin-bottom:24px;" />
    <p><a href="${targetUrl}" style="color:#38bdf8;text-decoration:none;font-weight:bold;">Click here to continue to EPIC Church →</a></p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(html);
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
