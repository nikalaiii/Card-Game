import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "../contexts/GameContext";
import { CharacterProvider } from "../contexts/CharacterContext";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { Navigation } from '../components/Navigation';
import { Kalnia_Glaze } from 'next/font/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kalnia = Kalnia_Glaze({ weight: ['400','700'], subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: "Card Game",
  description: "Multiplayer card game built with Next.js and NestJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={kalnia.className}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <CharacterProvider>
            <GameProvider>
              <Navigation />
              {children}
            </GameProvider>
          </CharacterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
