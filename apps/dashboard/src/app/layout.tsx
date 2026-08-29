import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCloud",
  description:
    "Deploy your AI-built projects without choosing servers, CPU or infrastructure. AutoCloud automatically finds the lowest-cost architecture for your application.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
