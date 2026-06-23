import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { DemoSession } from "@/components/DemoSession";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeServe — Local House Services Marketplace",
  description: "Find trusted local service providers for your home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-white font-sans text-gray-900 antialiased">
        <DemoSession />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} HomeServe — Local House Services Marketplace
        </footer>
      </body>
    </html>
  );
}
