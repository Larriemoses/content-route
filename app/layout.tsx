import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ContentRoute — publishing workspace',
  description: 'Evidence-backed LinkedIn publishing for one owner.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
