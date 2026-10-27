import { Inter } from 'next/font/google';

/** Self-hosted so /cu can use Inter without Google Fonts. */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  // The member page is dynamic, so Next only inlines this preload on static
  // routes. A cached font from /cu then drops the demo page's preload link
  // before hydration. Skip the link; the stylesheet still loads Inter.
  preload: false,
});
