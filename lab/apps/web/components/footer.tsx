import Link from "next/link";
import { ArrowUpRight, House } from "lucide-react";
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Link href="/" className="logo">
            <House size={23} />
            artparts.ci
          </Link>
          <p>
            De belles adresses.
            <br />
            De nouvelles histoires.
          </p>
        </div>
        <div>
          <span className="eyebrow">VOTRE PROCHAIN CHAPITRE</span>
          <h2>Et si tout commençait ici ?</h2>
          <Link href="/biens" className="text-link">
            Trouver mon bien <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Artparts.ci · Projet de démonstration
        </span>
        <span>Conçu pour la Côte d’Ivoire 🇨🇮</span>
      </div>
    </footer>
  );
}
