import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BridgeAI — Universal Intent-to-Action Translator',
  description:
    'Transform unstructured inputs — voice, photos, documents, text — into structured, verified, life-saving actions. Powered by Gemini.',
  keywords: [
    'AI',
    'Gemini',
    'accessibility',
    'universal translator',
    'structured data',
    'multimodal',
  ],
  authors: [{ name: 'BridgeAI Team' }],
  openGraph: {
    title: 'BridgeAI — Universal Intent-to-Action Translator',
    description:
      'Transform any input into structured, verified actions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip link for keyboard navigation (accessibility) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
