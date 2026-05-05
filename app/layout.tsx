import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Resmi Karar Formu Oluşturucu',
  description: 'Gündem maddeleri ve karar çıktı sistemi',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
