import type { Metadata } from "next";
import "./globals.css";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";

export const metadata: Metadata = {
  title: "NOVIDECH MITUELLE LLC",
  description: "Nouvelle vision pour le developpement economique des citoyens haitiens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
      </body>
    </html>
  );
}

