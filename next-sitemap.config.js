/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://i79.ai",
  generateRobotsTxt: true,
  sitemapSize: 7000,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },
  transform: async (config, path) => {
    const priorities = {
      "/": 1.0,
      "/engage": 0.9,
      "/services": 0.8,
      "/contact": 0.6,
    };
    const changefreqs = {
      "/": "weekly",
      "/engage": "weekly",
      "/services": "monthly",
      "/contact": "monthly",
    };
    return {
      loc: path,
      changefreq: changefreqs[path] ?? "monthly",
      priority: priorities[path] ?? 0.5,
      lastmod: new Date().toISOString(),
    };
  },
};
