export const metadata = {
  title: "Ken — mock connector server",
  description: "Delhivery-shaped mock + custom insurer capabilities for The Ken x Pine Labs Round 3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
