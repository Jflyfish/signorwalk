import { Inter } from 'next/font/google';

/** Self-hosted so /cu can use Inter without Google Fonts. */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});
