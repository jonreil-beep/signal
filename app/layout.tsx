import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: "Claro – Smarter search for experienced professionals",
  description: "Job search intelligence for experienced professionals — honest fit scoring, targeted prep, and resume guidance.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <GoogleAnalytics />
        {children}
        {/* <FeedbackButton /> */}
      </body>
    </html>
  );
}
