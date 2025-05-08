import type { Metadata } from "next";
import { Orbitron, Rajdhani, Chakra_Petch, Oxanium } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-rajdhani",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-chakra-petch",
});

const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-oxanium",
});

export const metadata: Metadata = {
  title: "NEURALFRONT",
  description: "AI vs AI Cyberwar Battlefield",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-rajdhani antialiased", // font-rajdhani is default
          orbitron.variable,
          rajdhani.variable,
          chakraPetch.variable,
          oxanium.variable
        )}
      >
        {children}
      </body>
    </html>
  );
} 