import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0c",
};

export const metadata: Metadata = {
  title: "TMD — The Match Date",
  description: "Mobile-first dating application with real-world events.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TMD",
  },
  icons: {
    icon: "/images/splash-logo.png",
    apple: "/images/splash-logo.png",
  },
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
        <PushNotificationPrompt />
        {children}
      </body>
    </html>
  );
}
