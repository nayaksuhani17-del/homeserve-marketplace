import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClientNavbar } from "@/components/ClientNavbar";
import { ClientLayoutExtras } from "@/components/ClientLayoutExtras";
import { AppLoadingGate } from "@/components/AppLoadingGate";
import { BrandName } from "@/components/BrandName";
import { ToastProvider } from "@/components/Toast";
import { MockAppProvider } from "@/context/MockAppContext";
import { BRAND_DESCRIPTION, BRAND_PAGE_TITLE } from "@/lib/brand";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BRAND_PAGE_TITLE,
  description: BRAND_DESCRIPTION,
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
          <AppLoadingGate>
            <ToastProvider>
              <ClientLayoutExtras />
              <ClientNavbar />
              <main className="page-enter flex-1">{children}</main>
              <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-500">
                <div className="flex flex-col items-center gap-1">
                  <BrandName size="sm" />
                  <p className="text-gray-400">interactive demo</p>
                </div>
              </footer>
            </ToastProvider>
          </AppLoadingGate>
        </MockAppProvider>
      </body>
    </html>
  );
}
