import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITELSA SAS | Relevamiento",
  description: "Relevamiento de columnas de iluminación deportiva — Itelsa Smart Lighting",
};

const NAV = [
  { href: "/", label: "Estadios" },
  { href: "/modelos", label: "Modelos" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background">
        <header className="border-b-2 border-(--accent) bg-white">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Itelsa"
                className="h-14 w-auto object-contain sm:h-20"
              />
            </Link>
            <nav className="flex items-center gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded bg-[#14746f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f5a56]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
