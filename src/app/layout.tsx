import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AdminProvider } from "@/contexts/AdminContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Employee Portal - CodeBord",
  description: "Employee management system for Codebord",
  keywords: "employee management, attendance, CodeBord, HR system",
  authors: [{ name: "CodeBord Team" }],
  creator: "CodeBord",
  publisher: "CodeBord",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml', rel: 'icon', sizes: 'any' },
    ],
    shortcut: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#091e65',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-poppins antialiased`}
      >
        <AdminProvider>
          {children}
        </AdminProvider>
      </body>
    </html>
  );
}
