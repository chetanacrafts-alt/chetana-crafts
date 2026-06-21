import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/context/data-context";
import { AppHeader } from "@/components/layout/app-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Chetana Crafts | Business Dashboard",
  description:
    "Order, stock, and sales dashboard for Chetana Crafts handcrafted chaniya choli, Rajkot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <DataProvider>
          <AppHeader />
          <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <Toaster position="top-center" richColors />
        </DataProvider>
      </body>
    </html>
  );
}
