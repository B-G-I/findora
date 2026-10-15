/**
 * data/articles.js — Master Blog Article Loader
 *
 * Aggregates all batch files into a single sorted article list.
 * The blog hub (blog.html) and article reader (article.html) both
 * import this via <script> tags in order:
 *   1. batch1-hosting.js
 *   2. batch2-vps.js
 *   3. batch3-tutorials.js
 *   4. batch4-business.js
 *   5. articles.js   ← this file
 */

(function () {
  // Merge all batches — each batch file exports to window.batchN
  const allArticles = [
    ...(typeof batch1Hosting  !== 'undefined' ? batch1Hosting  : []),
    ...(typeof batch2Vps      !== 'undefined' ? batch2Vps      : []),
    ...(typeof batch3Tutorials!== 'undefined' ? batch3Tutorials: []),
    ...(typeof batch4Business !== 'undefined' ? batch4Business : []),
  ];

  // Sort newest first (simple lexicographic sort works with "Month DD, YYYY" format
  // because we rely on the article index order for now; add ISO date for true sorting)
  window.FA_ARTICLES = allArticles;

  /**
   * getArticle(slug) → article object or null
   */
  window.FA_getArticle = function (slug) {
    return allArticles.find(a => a.slug === slug) || null;
  };

  /**
   * getArticlesByCategory(categorySlug) → filtered array
   */
  window.FA_getByCategory = function (categorySlug) {
    if (!categorySlug || categorySlug === 'all') return allArticles;
    return allArticles.filter(a => a.categorySlug === categorySlug);
  };

  /**
   * searchArticles(query) → filtered array (title + excerpt)
   */
  window.FA_search = function (query) {
    if (!query) return allArticles;
    const q = query.toLowerCase();
    return allArticles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  };
})();
