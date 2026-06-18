import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CafeSync ERP",
  description: "Mini ERP for Cafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen bg-slate-50`}>
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
