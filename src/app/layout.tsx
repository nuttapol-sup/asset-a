import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'ระบบคุมครุภัณฑ์ - Asset Management System',
  description: 'ระบบคุมครุภัณฑ์ พัฒนาด้วย Next.js และ MongoDB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-900 font-sans antialiased">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
