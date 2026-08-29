import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AutoCloud — You build. AI chooses where it runs.",
    template: "%s — AutoCloud",
  },
  description:
    "Deploy your AI-built projects without choosing servers, CPU or infrastructure. AutoCloud automatically finds the lowest-cost architecture for your application.",
  openGraph: {
    siteName: "AutoCloud",
    type: "website",
    title: "AutoCloud — You build. AI chooses where it runs.",
    description:
      "AI-native deploy platform: automatic architecture selection, cost estimates before every deploy, built for coding agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoCloud — You build. AI chooses where it runs.",
    description:
      "AI-native deploy platform: automatic architecture selection, cost estimates before every deploy, built for coding agents.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
