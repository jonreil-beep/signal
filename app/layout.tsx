import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://claroapp.co"),
  title: "Claro – Know your fit before you apply",
  description: "Claro reads your resume, scores any job description against your background, and tells you exactly how a recruiter sees you and what to do about it.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "Claro – Know your fit before you apply",
    description: "Claro reads your resume, scores any job description against your background, and tells you exactly how a recruiter sees you and what to do about it.",
    url: "https://claroapp.co",
    siteName: "Claro",
    images: [{ url: "/screenshots/app-screenshot.png", width: 1200, height: 800 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claro – Know your fit before you apply",
    description: "Claro reads your resume, scores any job description against your background, and tells you exactly how a recruiter sees you and what to do about it.",
    images: ["/screenshots/app-screenshot.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <GoogleAnalytics />
        {children}
        {/* <FeedbackButton /> */}
      </body>
    </html>
  );
}
