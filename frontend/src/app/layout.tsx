import React from 'react';
import type { Metadata } from 'next';
import { AuthProvider } from '@utils/authContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Creative Engine - Product Photography Made Easy',
  description: 'Remove backgrounds, generate environments, and capture perfect product photos with AI.',
  keywords: ['AI', 'photography', 'product', 'background removal', 'environment generation'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
