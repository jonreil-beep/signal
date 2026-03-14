import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Signal — Job Search Intelligence",
  description: "Job search intelligence for experienced professionals — honest fit scoring, targeted prep, and resume guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
