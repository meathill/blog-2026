import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "山维空间 - Meathill 的技术博客",
    template: "%s | 山维空间",
  },
  description: "19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。专注于 Vue.js、React、Node.js、TypeScript 等现代前端技术。",
  keywords: ["前端开发", "全栈开发", "Vue.js", "React", "Node.js", "TypeScript", "技术博客"],
  authors: [{ name: "Meathill", url: "https://meathill.com" }],
  creator: "Meathill",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://blog.meathill.com",
    siteName: "山维空间",
    title: "山维空间 - Meathill 的技术博客",
    description: "19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@meathill1",
    title: "山维空间 - Meathill 的技术博客",
    description: "19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
