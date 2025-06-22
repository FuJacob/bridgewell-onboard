import type { Metadata } from "next";
import "./globals.css";

import { Lexend } from "next/font/google";
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title:
    "Bridgewell Client Onboarding Portal- Financial Services for Organizations and Professionals",
  description:
    "Bridgewell Client Onboarding Portal is a secure and user-friendly web application that facilitates the onboarding of Bridgewell clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable}`}>
      <head>
        <link rel="icon" href="favicon.png" />
      </head>
      <body className={` antialiased max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`}>
        {children}
      </body>
    </html>
  );
}
