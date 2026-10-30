"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, House, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./providers";
export function Header() {
  const { user } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <Link href="/" className="logo" aria-label="Artparts accueil">
        <span className="logo-icon">
          <House size={22} />
        </span>
        artparts<span className="logo-dot">.ci</span>
      </Link>
      <button
        className="icon-button mobile-menu"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "nav open" : "nav"} onClick={() => setOpen(false)}>
        <Link className={path === "/biens" ? "active" : ""} href="/biens">
          Explorer les biens
        </Link>
        <Link href="/biens?transaction=rent">Louer</Link>
        <Link href="/biens?transaction=sale">Acheter</Link>
        <Link href="/espace">
          {user ? "Mon espace" : "Espace professionnel"}
        </Link>
      </nav>
      <Link
        className="button small header-cta"
        href={user ? "/espace" : "/connexion"}
      >
        {user ? user.name.split(" ")[0] : "Se connecter"}
        <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
