import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Artparts.ci — Votre prochaine adresse",
    template: "%s · Artparts.ci",
  },
  description:
    "Trouvez votre prochain chez-vous en Côte d’Ivoire. Achat, location, visites à 360° et rendez-vous en ligne.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
