import type { Metadata } from 'next';
import { Playfair_Display, Cormorant_Garamond, Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FashionAI — Your AI-Powered Personal Stylist',
  description:
    'Generate perfect outfit combinations from your wardrobe, powered by AI. Personalized for your body, style, and the weather.',
  keywords: ['fashion', 'AI stylist', 'outfit generator', 'wardrobe', 'style'],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
