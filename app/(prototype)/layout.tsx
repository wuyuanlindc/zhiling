import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "指令流转中心 1.2 高保真原型",
  description: "指令流转 1.2 完整业务原型",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="stylesheet" href="/prototype.css" />
      </head>
      <body>
        <Script src="/vendor/echarts.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/lucide-0.468.0.min.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
