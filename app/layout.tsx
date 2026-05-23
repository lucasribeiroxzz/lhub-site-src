import type { Metadata } from "next";
import "./globals.css";
import { AntiInspect } from "@/components/AntiInspect";
import { VisitTracker } from "@/components/VisitTracker";
import { CookieCleaner } from "@/components/CookieCleaner";

export const metadata: Metadata = {
  title: "LHUB - Sua Loja de Serviços Digitais",
  description: "Passe de Elite, Likes, Contas Guest, Bypass, Cheats e muito mais. A plataforma #1 de serviços digitais para gamers.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <AntiInspect />
        <VisitTracker />
        <CookieCleaner />
        {children}
      </body>
    </html>
  );
}
