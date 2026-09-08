import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golestan Course Extractor | استخراج دروس گلستان',
  description: 'استخراج هوشمند و مرتب‌سازی دروس ارائه شده سامانه گلستان',
};

// Extension popup shell: RTL + dark, Vazirmatn served locally from /fonts.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
