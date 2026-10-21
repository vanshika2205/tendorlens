import './globals.css';

export const metadata = {
  title: 'TenderLens | AI Vendor Compliance & Tender Document Screening',
  description: 'Enterprise procurement intelligence platform with automated document screening and discrepancy detection.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
