import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section empty">
      <span className="eyebrow">404 · CETTE ADRESSE N’EXISTE PAS</span>
      <h1>Reprenons le bon chemin.</h1>
      <Link className="button" href="/">
        Revenir à l’accueil
      </Link>
    </main>
  );
}
