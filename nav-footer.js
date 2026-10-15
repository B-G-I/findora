/**
 * nav-footer.js
 * Injects the shared sticky navigation and rich footer into every page.
 * Called by every HTML page via: <script src="/nav-footer.js"></script>
 */

(function () {
  // ── Detect active page ──────────────────────────────────────────────
  const path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const isActive = (href) => {
    const h = href.replace(/\.html$/, '');
    if (h === '/' || h === '/index') return path === '/' || path === '/index' || path === '';
    return path.startsWith(h);
  };

  // ── NAV HTML ────────────────────────────────────────────────────────
  const navLinks = [
    { href: '/',            label: 'Home' },
    { href: '/index#services', label: 'Services' },
    { href: '/blog',        label: 'Hosting & Tech Guides' },
    { href: '/blog#top-picks', label: 'Top Hosting Picks' },
    { href: '/index#contact',  label: 'Contact Us', cta: true },
  ];

  const navHTML = `
<nav class="site-nav" role="navigation" aria-label="Main navigation">
  <div class="site-nav__inner">
    <a href="/" class="site-nav__logo" aria-label="Find Aura Home">
      <img src="/assets/business-card-1.png" alt="Find Aura logo" />
      <span class="site-nav__logo-wordmark">Find Aura</span>
    </a>
    <button class="site-nav__hamburger" id="navHamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="site-nav__links" id="navLinks" role="list">
      ${navLinks.map(l => `
        <li role="listitem">
          <a href="${l.href}"${isActive(l.href) ? ' class="' + (l.cta ? 'nav-cta active' : 'active') + '"' : l.cta ? ' class="nav-cta"' : ''}>${l.label}</a>
        </li>`).join('')}
    </ul>
  </div>
</nav>`;

  // ── FOOTER HTML ─────────────────────────────────────────────────────
  const footerHTML = `
<footer class="site-footer" role="contentinfo">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      <h3>Find Aura</h3>
      <p>We build smart apps, modern web experiences, and powerful software. Specializing in Laravel, Flutter, Cloud VPS, and scalable web infrastructure.</p>
      <div class="site-footer__disclaimer">
        <strong>FTC Affiliate Disclosure:</strong> Find Aura participates in affiliate programs including Hostinger, Namecheap, and Impact.com. We may earn a commission when you purchase through our links — at <em>no extra cost to you</em>. All reviews reflect our genuine, independent testing. <a href="/disclosure" style="color:rgba(95,227,217,0.8)">Learn more →</a>
      </div>
    </div>

    <div class="site-footer__col">
      <h4>Navigation</h4>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/index#services">Services</a></li>
        <li><a href="/blog">Hosting &amp; Tech Guides</a></li>
        <li><a href="/blog#top-picks">Top Hosting Picks</a></li>
        <li><a href="/index#contact">Contact Us</a></li>
      </ul>
    </div>

    <div class="site-footer__col">
      <h4>Blog Categories</h4>
      <ul>
        <li><a href="/blog?cat=hosting-reviews">Hosting Reviews</a></li>
        <li><a href="/blog?cat=vps-cloud">VPS &amp; Cloud</a></li>
        <li><a href="/blog?cat=deployment-tutorials">Deployment Tutorials</a></li>
        <li><a href="/blog?cat=small-business-domains">Small Business &amp; Domains</a></li>
      </ul>
    </div>

    <div class="site-footer__col">
      <h4>Legal</h4>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/disclosure">Affiliate Disclosure</a></li>
      </ul>
      <h4 style="margin-top:1.25rem">Contact</h4>
      <ul>
        <li><a href="https://wa.me/213674291619" target="_blank" rel="noopener">WhatsApp Us</a></li>
        <li><a href="/#contact">Project Enquiry</a></li>
      </ul>
    </div>
  </div>

  <div class="site-footer__bottom">
    <span>© 2026 Find Aura (findaura.org). All rights reserved.</span>
    <div>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/disclosure">Affiliate Disclosure</a>
    </div>
  </div>
</footer>`;

  // ── Inject NAV before <body> content ────────────────────────────────
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // ── Inject FOOTER at end of <body> ──────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ── Hamburger toggle ─────────────────────────────────────────────────
  const hamburger = document.getElementById('navHamburger');
  const linksList = document.getElementById('navLinks');
  if (hamburger && linksList) {
    hamburger.addEventListener('click', function () {
      const open = linksList.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // ── Close nav on outside click ───────────────────────────────────────
  document.addEventListener('click', function (e) {
    if (hamburger && linksList && !hamburger.contains(e.target) && !linksList.contains(e.target)) {
      linksList.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();
