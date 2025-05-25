'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense, useEffect, useState, useRef } from "react";
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
  const previousPathname = useRef(pathname);
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    // Solo mostrar loading si realmente cambió la ruta y no es la carga inicial
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Solo ejecutar si realmente cambió la ruta
    if (previousPathname.current !== pathname) {
      const handleStart = () => {
        setIsLoading(true);
      };

      const handleComplete = () => {
        setTimeout(() => {
          setIsLoading(false);
        }, 300); // Reducido el tiempo
      };

      handleStart();
      const timer = setTimeout(handleComplete, 400); // Reducido el tiempo total

      previousPathname.current = pathname;

      return () => clearTimeout(timer);
    }
  }, [pathname]);

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
