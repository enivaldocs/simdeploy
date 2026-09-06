import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "SimDeploy — You build. AI chooses where it runs.",
    template: "%s — SimDeploy",
  },
  description:
    "Deploy your AI-built projects without choosing servers, CPU or infrastructure. SimDeploy automatically finds the lowest-cost architecture for your application.",
  openGraph: {
    siteName: "SimDeploy",
    type: "website",
    title: "SimDeploy — You build. AI chooses where it runs.",
    description:
      "AI-native deploy platform: automatic architecture selection, cost estimates before every deploy, built for coding agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SimDeploy — You build. AI chooses where it runs.",
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
