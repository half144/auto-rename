import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLdSchema from "./components/JsonLdSchema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Renomeador Automático de Arquivos | Renomeie arquivos em lote",
  description:
    "Ferramenta online gratuita para renomear arquivos em massa com base em planilhas Excel ou CSV. Ideal para professores, administradores e profissionais que gerenciam documentos.",
  keywords: [
    "renomear arquivos",
    "renomeação em lote",
    "renomear com Excel",
    "renomear arquivos online",
    "renomeador de arquivos",
    "processamento de arquivos",
    "automação de documentos",
  ],
  authors: [{ name: "Desenvolvedor", url: "https://github.com/half144" }],
  creator: "Desenvolvedor",
  publisher: "Renomeador Automático",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Renomeador Automático de Arquivos | Renomeie arquivos em lote",
    description:
      "Ferramenta online gratuita para renomear arquivos em massa com base em planilhas Excel ou CSV.",
    url: "https://auto-rename-zeta.vercel.app",
    siteName: "Renomeador Automático de Arquivos",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Renomeador Automático de Arquivos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Renomeador Automático de Arquivos | Renomeie arquivos em lote",
    description:
      "Ferramenta online gratuita para renomear arquivos em massa com base em planilhas Excel ou CSV.",
    creator: "@seu_twitter",
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: "https://auto-rename-zeta.vercel.app",
    languages: {
      "pt-BR": "https://auto-rename-zeta.vercel.app",
    },
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  verification: {
    google: "seu-codigo-de-verificacao-do-google",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLdSchema />
        {children}
      </body>
    </html>
  );
}
