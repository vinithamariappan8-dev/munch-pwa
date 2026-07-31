import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munch - The Yard Milkshake Bar",
  description: "Specialty milkshakes and delicious food delivered to your table",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}