import './globals.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeicons/primeicons.css';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientAuthProvider from './components/ClientAuthProvider';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Intelligent Accounting Management",
  description: "A robust accounting management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <ClientAuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
