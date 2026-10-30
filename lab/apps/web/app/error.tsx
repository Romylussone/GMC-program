"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="section empty">
      <h1>Une interruption inattendue.</h1>
      <p>Veuillez réessayer pour retrouver votre recherche.</p>
      <button className="button" onClick={reset}>
        Réessayer
      </button>
    </main>
  );
}
