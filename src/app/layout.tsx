import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClientNavbar } from "@/components/ClientNavbar";
import { ClientLayoutExtras } from "@/components/ClientLayoutExtras";
import { AppLoadingGate } from "@/components/AppLoadingGate";
import { ToastProvider } from "@/components/Toast";
import { MockAppProvider } from "@/context/MockAppContext";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeServe — Find Trusted Home Services Instantly",
  description: "Book verified local pros for plumbing, cleaning, electrical, and more.",
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
              <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
                <p className="font-medium text-gray-700">Trusted by homeowners nationwide</p>
                <p className="mt-1">© {new Date().getFullYear()} HomeServe — Verified local home services</p>
              </footer>
            </ToastProvider>
          </AppLoadingGate>
        </MockAppProvider>
      </body>
    </html>
  );
}
