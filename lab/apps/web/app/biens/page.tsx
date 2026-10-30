import { Suspense } from "react";
import Explorer from "./explorer";
export default function Page() {
  return (
    <Suspense
      fallback={<main className="section">Chargement de la recherche…</main>}
    >
      <Explorer />
    </Suspense>
  );
}
