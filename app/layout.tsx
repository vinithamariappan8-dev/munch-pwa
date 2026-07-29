import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Munch - Food Ordering App",
  description: "Delicious food delivered to your table",
  manifest: "/manifest.json", // 👈 இந்த வரியைச் சேர்க்கவும்
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