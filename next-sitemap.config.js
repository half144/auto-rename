/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://auto-rename-zeta.vercel.app",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [
      "https://auto-rename-zeta.vercel.app/server-sitemap.xml",
    ],
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
  exclude: ["/server-sitemap.xml"],
  generateIndexSitemap: true,
  outDir: "public",
  changefreq: "weekly",
  priority: 0.7,
};
