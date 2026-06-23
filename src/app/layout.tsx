import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClientNavbar } from "@/components/ClientNavbar";
import { DemoSession } from "@/components/DemoSession";
import { LiveActivity } from "@/components/LiveActivity";
import { ToastProvider } from "@/components/Toast";
import { MockAppProvider } from "@/context/MockAppContext";
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
        <MockAppProvider>
          <ToastProvider>
            <DemoSession />
            <ClientNavbar />
            <main className="page-enter flex-1">{children}</main>
            <LiveActivity />
            <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} HomeServe — Local House Services Marketplace
            </footer>
          </ToastProvider>
        </MockAppProvider>
      </body>
    </html>
  );
}
