import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NotificationListener } from "@/components/notifications/NotificationListener";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TMD — The Match Date",
  description: "Mobile-first dating application with real-world events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0a0a0c] text-white antialiased">
        <NotificationListener />
        {children}
      </body>
    </html>
  );
}
