import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saccos BnB",
  description: "Book your perfect stay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={inter.className}>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Saccos BnB. Alla rättigheter förbehållna.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
