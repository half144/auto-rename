import { getServerSideSitemap } from "next-sitemap";
import { NextResponse } from "next/server";
import type { ISitemapField } from "next-sitemap";

export async function GET() {
  // URLs estáticas que você deseja incluir no sitemap
  const staticUrls: ISitemapField[] = [
    {
      loc: "https://auto-rename-zeta.vercel.app",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: "https://auto-rename-zeta.vercel.app/termos",
      lastmod: new Date().toISOString(),
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      loc: "https://auto-rename-zeta.vercel.app/privacidade",
      lastmod: new Date().toISOString(),
      changefreq: "monthly",
      priority: 0.7,
    },
  ];

  // Cria o XML do sitemap
  const sitemap = getServerSideSitemap(staticUrls);

  return NextResponse.json(sitemap);
}
