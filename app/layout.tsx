import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MensajesProvider } from "../utils/MensajesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>SorenAI - Análisis inteligente de tus cultivos</title>
        <meta name="description" content="Análisis inteligente de tus cultivos" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MensajesProvider>
          {children}
        </MensajesProvider>
      </body>
    </html>
  );
}
