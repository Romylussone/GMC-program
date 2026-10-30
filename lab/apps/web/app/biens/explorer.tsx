"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Grid2X2, Map, Search, X, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { types, type Property } from "@/lib/types";
import { PropertyCard } from "@/components/property-card";
const PropertyMap = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => <div className="skeleton" />,
});
export default function Explorer() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.toString();
  const [result, setResult] = useState<{
    items: Property[];
    total: number;
    pages: number;
    page: number;
  }>({ items: [], total: 0, pages: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [map, setMap] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<typeof result>(`/properties?${query}`, { signal: controller.signal })
      .then((r) => {
        if (!controller.signal.aborted) setResult(r);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]);
  const page = (n: number) => {
    const p = new URLSearchParams(query);
    p.set("page", String(n));
    router.push(`/biens?${p}`);
  };
  return (
    <main className="section explorer">
      <div className="page-intro">
        <span className="eyebrow">VOTRE PROCHAINE ADRESSE COMMENCE ICI</span>
        <h1>
          Trouvez le lieu qui <em>vous ressemble.</em>
        </h1>
        <p>
          À Abidjan et au-delà, donnez une nouvelle perspective à votre
          recherche.
        </p>
      </div>
      <form
        key={query}
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams();
          new FormData(e.currentTarget).forEach((v, k) => {
            if (v) p.set(k, String(v));
          });
          router.push(`/biens?${p}`);
        }}
      >
        <label className="filter-search">
          <span>Ville ou quartier</span>
          <div className="input-icon">
            <Search size={17} />
            <input
              name="q"
              placeholder="Ex. Cocody, Abidjan"
              defaultValue={params.get("q") || ""}
            />
          </div>
        </label>
        <label>
          <span>Votre projet</span>
          <select
            name="transaction"
            defaultValue={params.get("transaction") || ""}
          >
            <option value="">Louer ou acheter</option>
            <option value="rent">Louer</option>
            <option value="sale">Acheter</option>
          </select>
        </label>
        <label>
          <span>Type de bien</span>
          <select name="type" defaultValue={params.get("type") || ""}>
            <option value="">Tous les types</option>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Budget max. (FCFA)</span>
          <input
            name="maxPrice"
            type="number"
            min="1"
            placeholder="Sans limite"
            defaultValue={params.get("maxPrice") || ""}
          />
        </label>
        <label>
          <span>Chambres min.</span>
          <select name="bedrooms" defaultValue={params.get("bedrooms") || ""}>
            <option value="">Indifférent</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </label>
        <label>
          <span>Trier par</span>
          <select name="sort" defaultValue={params.get("sort") || "recent"}>
            <option value="recent">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            name="tour"
            type="checkbox"
            value="true"
            defaultChecked={params.get("tour") === "true"}
          />
          Visite 360°
        </label>
        <button className="button" type="submit">
          Rechercher
          <Search size={16} />
        </button>
      </form>
      <div className="results-toolbar">
        <span>
          <strong>{loading ? "…" : result.total}</strong> biens à découvrir{" "}
          {query && (
            <button className="reset" onClick={() => router.push("/biens")}>
              <X size={13} />
              Réinitialiser
            </button>
          )}
        </span>
        <div className="view-toggle">
          <button
            className={!map ? "selected" : ""}
            aria-pressed={!map}
            onClick={() => setMap(false)}
          >
            <Grid2X2 size={16} />
            Liste
          </button>
          <button
            className={map ? "selected" : ""}
            aria-pressed={map}
            onClick={() => setMap(true)}
          >
            <Map size={16} />
            Carte
          </button>
        </div>
      </div>
      {error ? (
        <div role="alert" className="notice error">
          {error}
        </div>
      ) : loading ? (
        <div className="property-grid">
          {[1, 2, 3].map((n) => (
            <div className="skeleton" key={n} />
          ))}
        </div>
      ) : !result.items.length ? (
        <div className="empty">
          <Search size={32} />
          <h2>Aucun bien pour cette recherche.</h2>
          <p>Essayez un autre quartier ou élargissez votre budget.</p>
          <button className="button" onClick={() => router.push("/biens")}>
            Voir tous les biens
          </button>
        </div>
      ) : map ? (
        <>
          <PropertyMap properties={result.items} />
          <p className="small-note">
            La carte affiche les biens de la page actuelle. Cliquez sur un
            repère pour découvrir l’annonce.
          </p>
        </>
      ) : (
        <div className="property-grid">
          {result.items.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      )}
      {result.pages > 1 && (
        <div className="pagination">
          <button
            className="button secondary"
            disabled={result.page <= 1}
            onClick={() => page(result.page - 1)}
          >
            <ArrowLeft size={16} />
            Précédent
          </button>
          <span>
            Page {result.page} sur {result.pages}
          </span>
          <button
            className="button secondary"
            disabled={result.page >= result.pages}
            onClick={() => page(result.page + 1)}
          >
            Suivant
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
