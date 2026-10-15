/**
 * article.js — Single Article Reader
 *
 * Reads the slug from the URL pathname (/blog/<slug>),
 * looks up the article in window.FA_ARTICLES, and
 * renders the full article layout into #articleMain.
 */

document.addEventListener('DOMContentLoaded', function () {
  const main = document.getElementById('articleMain');

  // ── Extract slug from path: /blog/<slug> or ?slug=<slug> ─────────
  const urlParams = new URLSearchParams(window.location.search);
  const slugFromQuery = urlParams.get('slug');
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || '';
  const slugFromPath = (lastPart === 'article' || lastPart === 'article.html') ? '' : lastPart;
  const slug = slugFromQuery || slugFromPath || '';

  const article = window.FA_getArticle ? window.FA_getArticle(slug) : null;

  if (!article) {
    main.innerHTML = renderNotFound(slug);
    return;
  }

  // ── Update <head> meta ───────────────────────────────────────────
  document.title = `${article.title} — Find Aura`;
  const descEl = document.getElementById('articlePageDesc');
  if (descEl) descEl.setAttribute('content', article.excerpt);
  const canonEl = document.getElementById('articleCanonical');
  if (canonEl) canonEl.setAttribute('href', `https://findaura.org/blog/${article.slug}`);

  // ── Render article ───────────────────────────────────────────────
  main.innerHTML = `
    <div class="article-page">
      <!-- ── Main Column ── -->
      <div>
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span class="sep">›</span>
          <a href="/blog">Guides</a>
          <span class="sep">›</span>
          <a href="/blog?cat=${encHtml(article.categorySlug)}">${encHtml(article.category)}</a>
          <span class="sep">›</span>
          <span aria-current="page">${encHtml(truncate(article.title, 52))}</span>
        </nav>

        <!-- FTC Disclosure Banner -->
        <div class="ftc-banner" role="note" aria-label="Affiliate disclosure">
          <span class="ftc-banner__icon">⚖️</span>
          <div>
            <strong>Transparency Note:</strong> Some links in this guide may be affiliate links
            (Hostinger, Namecheap, Impact.com). If you click and purchase, we earn a small commission
            — at <em>no extra cost to you</em>. This never influences our scores or test results.
            <a href="/disclosure">Full disclosure →</a>
          </div>
        </div>

        <!-- Article Header -->
        <header class="article-header">
          <span class="guide-card__badge ${badgeClass(article.categorySlug)} article-badge">${encHtml(article.category)}</span>
          <h1>${encHtml(article.title)}</h1>
          <div class="article-meta">
            <span>📅 ${encHtml(article.date)}</span>
            <span>⏱ ${encHtml(article.readTime)}</span>
            <span>✍️ Abderrahmane Anis Nacef</span>
          </div>
        </header>

        <!-- Article Body -->
        <div class="article-body">
          ${article.body}
        </div>

        <!-- Author Bio -->
        <div class="author-bio" aria-label="About the author">
          <div class="author-bio__avatar" aria-hidden="true">A</div>
          <div>
            <div class="author-bio__name">Abderrahmane Anis Nacef</div>
            <div class="author-bio__role">Full-Stack Software Developer &amp; Founder at Find Aura</div>
            <div class="author-bio__desc">
              Specializing in Laravel, Flutter, Cloud VPS architecture, and scalable web infrastructure.
              Every review published on Find Aura is based on hands-on testing — no recycled press releases.
            </div>
          </div>
        </div>
      </div>

      <!-- ── Sidebar ── -->
      <aside class="article-sidebar" aria-label="Article sidebar">
        ${renderToc(article.toc)}
        <div class="sidebar-cta">
          <h4>Need a Custom Solution?</h4>
          <p>We build Laravel APIs, Flutter apps, and cloud infrastructure. Let's talk about your project.</p>
          <a href="/#contact" id="sidebarCtaBtn">Start a Project →</a>
        </div>
      </aside>
    </div>`;
});

// ── Helpers ───────────────────────────────────────────────────────────

function encHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str || '');
  return d.innerHTML;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function badgeClass(slug) {
  const map = {
    'hosting-reviews':      'badge--hosting',
    'vps-cloud':            'badge--vps',
    'deployment-tutorials': 'badge--tutorial',
    'small-business-domains':'badge--business',
  };
  return map[slug] || 'badge--hosting';
}

function renderToc(toc) {
  if (!toc || toc.length === 0) return '';
  const items = toc.map(t =>
    `<li><a href="#${encHtml(t.id)}">${encHtml(t.label)}</a></li>`
  ).join('');
  return `
    <div class="toc-card" aria-labelledby="tocHeading">
      <h4 id="tocHeading">Table of Contents</h4>
      <ol>${items}</ol>
    </div>`;
}

function renderNotFound(slug) {
  return `
    <div style="text-align:center;padding:6rem 1.5rem;max-width:600px;margin:0 auto;">
      <div style="font-size:3rem;margin-bottom:1rem">📄</div>
      <h1 style="font-size:1.8rem;color:#4A4A4A;margin-bottom:0.75rem">Article Not Found</h1>
      <p style="color:#6c757d;margin-bottom:2rem">
        We couldn't find an article with the slug <code style="background:#f0f0f0;padding:0.2em 0.5em;border-radius:4px">${encHtml(slug)}</code>.
        It may be coming soon.
      </p>
      <a href="/blog" style="display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#5FE3D9,#B565D8);color:#fff;padding:0.75rem 1.75rem;border-radius:50px;text-decoration:none;font-weight:600;">
        ← Browse All Guides
      </a>
    </div>`;
}
