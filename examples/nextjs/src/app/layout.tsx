import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XMTP Next.js example",
  description: "XMTP chat app using Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
