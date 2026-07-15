import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Construction Copilot",
  description:
    "AI Project Discovery — Thu thập & chuẩn hoá yêu cầu khách hàng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-muted/30 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
