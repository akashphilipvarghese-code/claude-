import "./globals.css";

export const metadata = {
  title: "Tradeix — Live Map",
  description: "Real-time global shipment intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
