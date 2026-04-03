import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Signal – Smarter search for experienced professionals",
  description: "Job search intelligence for experienced professionals — honest fit scoring, targeted prep, and resume guidance.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
