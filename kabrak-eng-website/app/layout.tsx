import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KABRAK ENG - Solutions Logicielles Professionnelles",
  description: "KABRAK ENG développe des solutions logicielles innovantes pour les entreprises : KABRAK Exchange Pro pour bureaux de change, KABRAK Optic Pro pour opticiens.",
  keywords: "KABRAK, logiciel bureau de change, logiciel opticien, solutions entreprise, Cameroun",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
