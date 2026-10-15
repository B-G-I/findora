/**
 * blog.js — Blog Hub Logic
 * Renders the article grid, handles search and category filtering.
 */

document.addEventListener('DOMContentLoaded', function () {
  const grid       = document.getElementById('blogGrid');
  const searchInput= document.getElementById('blogSearchInput');
  const searchBtn  = document.getElementById('blogSearchBtn');
  const pills      = document.querySelectorAll('.filter-pill');

  let currentCat   = 'all';
  let currentQuery = '';

  // ── Render ───────────────────────────────────────────────────────
  function render() {
    let articles = window.FA_ARTICLES || [];

    // Filter by category
    if (currentCat !== 'all') {
      articles = articles.filter(a => a.categorySlug === currentCat);
    }

    // Filter by search query
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }

    if (articles.length === 0) {
      grid.innerHTML = `
        <div class="blog-no-results">
          <p style="font-size:2rem;margin-bottom:0.5rem">📭</p>
          <p>No articles found. <button onclick="resetFilters()" style="background:none;border:none;color:#B565D8;cursor:pointer;font-size:1rem;font-family:inherit">Clear filters</button></p>
        </div>`;
      return;
    }

    grid.innerHTML = articles.map((a, i) => `
      <article class="guide-card" style="animation: fadeInUp 0.4s ease-out ${i * 0.05}s both" aria-labelledby="card-title-${i}">
        <div class="guide-card__body">
          <span class="guide-card__badge ${badgeClass(a.categorySlug)}">${escHtml(a.category)}</span>
          <div class="guide-card__title" id="card-title-${i}">${escHtml(a.title)}</div>
          <div class="guide-card__excerpt">${escHtml(a.excerpt)}</div>
          <div class="guide-card__meta">📅 ${escHtml(a.date)} &nbsp;·&nbsp; ⏱ ${escHtml(a.readTime)}</div>
          <a href="/blog/${encodeURIComponent(a.slug)}" class="guide-card__link">Read Article →</a>
        </div>
      </article>`).join('');
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

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  window.resetFilters = function () {
    currentCat = 'all';
    currentQuery = '';
    searchInput.value = '';
    pills.forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
    render();
  };

  // ── Category pills ────────────────────────────────────────────────
  pills.forEach(pill => {
    pill.addEventListener('click', function () {
      currentCat = this.dataset.cat;
      pills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      render();
    });
  });

  // ── Search ────────────────────────────────────────────────────────
  function doSearch() {
    currentQuery = searchInput.value.trim();
    render();
  }

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });
  // Live search with debounce
  let debounceTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, 280);
  });

  // ── Handle ?cat= query param from footer links ────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const catParam  = urlParams.get('cat');
  if (catParam) {
    currentCat = catParam;
    pills.forEach(p => p.classList.toggle('active', p.dataset.cat === catParam));
  }

  // ── Initial render ────────────────────────────────────────────────
  render();
});
