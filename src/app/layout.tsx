import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "MyOrbita",
  description: "Plataforma de gestión académica personal — biblioteca, calendario y notas",
  icons: {
    icon: "/logo/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased h-full min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
