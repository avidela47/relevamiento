import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
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
  title: "Relevamiento — Itelsa",
  description: "Relevamiento de columnas de iluminación deportiva — Itelsa Smart Lighting",
};

const NAV = [
  { href: "/", label: "Canchas" },
  { href: "/modelos", label: "Modelos" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <aside className="flex w-60 flex-col bg-[var(--sidebar-bg)] px-4 py-5 text-[var(--sidebar-fg)]">
            <Link href="/" className="mb-8 flex items-center gap-2 px-2">
              <Image
                src="/logo.png"
                alt="Itelsa"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">Relevamiento</span>
            </Link>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Relevamiento
            </p>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-2 text-sm hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex flex-1 flex-col">
            <header className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-6 py-3">
              <span className="text-sm font-medium text-white">Itelsa Smart Lighting</span>
            </header>
            <main className="flex-1 bg-[var(--background)] px-6 py-6">
              <div className="mx-auto w-full max-w-4xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
