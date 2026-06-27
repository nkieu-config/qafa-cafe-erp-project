import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/providers/QueryProvider";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "QafaCafe ERP",
  description: "Enterprise POS and Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.className} flex min-h-screen bg-slate-50 dark:bg-slate-950 bg-[url('/bg-pattern.svg')] dark:bg-none bg-fixed text-slate-900 dark:text-slate-50 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
              {children}
              <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
