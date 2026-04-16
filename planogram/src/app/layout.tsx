import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planogram Builder – Visual Merchandising Platform",
  description:
    "Configure store fixtures, arrange shelves, and drag-and-drop products with snap-to-grid precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
