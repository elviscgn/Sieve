import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import Sidebar from "@/components/layout/Sidebar";
import Sidebar from "@/components/layouts/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sieve – AI-Assisted Screening",
  description: "Human-led hiring decisions powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}