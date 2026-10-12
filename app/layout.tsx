import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Identidad del sitio (spec 003-identidad-sitio): cada sección fija su título en su layout y la
// plantilla añade « · UrbanAlert»; la página principal usa el título por defecto.
export const metadata: Metadata = {
  title: { default: "UrbanAlert", template: "%s · UrbanAlert" },
  description: "Reporte y seguimiento de daños urbanos en Bogotá",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
