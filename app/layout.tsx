'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense, useEffect, useState } from "react";
import Loading from "./loading";
import { usePathname } from "next/navigation";
import { MensajesProvider } from "../utils/MensajesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata ahora debe estar en un archivo metadata.ts separado

// Wrapper para el contenido del layout que usa Suspense para useSearchParams
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleComplete = () => {
      // Pequeño retraso para asegurar que se vea el spinner
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    };

    // Simulamos el inicio de la navegación
    handleStart();
    
    // Simulamos la finalización de la navegación después de un tiempo
    const timer = setTimeout(handleComplete, 800);

    return () => clearTimeout(timer);
  }, [pathname]); // Solo dependemos del pathname

  return (
    <>
      {isLoading && <Loading />}
      {children}
    </>
  );
}

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
          <Suspense fallback={<Loading />}>
            <LayoutContent>
              {children}
            </LayoutContent>
          </Suspense>
        </MensajesProvider>
      </body>
    </html>
  );
}
