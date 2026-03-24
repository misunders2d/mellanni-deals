import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mellanni | Influencer Promotions",
  description: "View upcoming and active promotions for Mellanni products.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable} h-full`}>
      <body className={`${jakarta.className} min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground`}>
        <Navigation />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CookieConsent />
      </body>
    </html>
  );
}
