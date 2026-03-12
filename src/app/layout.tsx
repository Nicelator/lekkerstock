import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/lib/posthog";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "Lekkerstock — Premium African Stock Content",
    template: "%s | Lekkerstock",
  },
  description:
    "License high-quality African photos, videos, illustrations and 3D assets. The premier stock content platform for African creators and global buyers.",
  keywords: ["African stock photos", "African content", "stock photography", "Nigeria", "Africa"],
  openGraph: {
    title: "Lekkerstock — Premium African Stock Content",
    description: "License high-quality African creative content.",
    url: "https://lekkerstock.com",
    siteName: "Lekkerstock",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lekkerstock",
    description: "Premium African stock content.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body className={`${outfit.variable} font-sans bg-bg text-cream antialiased`}>
        <PostHogProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1108",
                border: "1px solid rgba(200,105,46,0.2)",
                color: "#faf6ef",
              },
            }}
          />
        </PostHogProvider>
      </body>
    </html>
  );
}