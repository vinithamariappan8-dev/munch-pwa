import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Yard Milkshake Bar",
  description: "Order over-the-top milkshakes & desserts!",
  manifest: "/manifest.json",
  themeColor: "#E0006C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}