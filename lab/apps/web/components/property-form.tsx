"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { api, body } from "@/lib/api";
import { types, type Property } from "@/lib/types";
import { useAuth } from "./providers";
export function PropertyForm({ id }: { id?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.replace("/connexion");
  }, [user, loading, router]);
  useEffect(() => {
    if (!id || !user || user.role === "seeker") return;
    api<Property[]>("/me/properties")
      .then((items) => {
        const p = items.find((p) => p._id === id);
        if (!p) throw new Error("Annonce introuvable dans votre portefeuille.");
        setProperty(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [id, user?._id]);
  if (loading || !user) return <main className="section">Chargement…</main>;
  if (user.role === "seeker")
    return (
      <main className="section empty">
        <h1>Espace professionnel</h1>
        <p>La publication est réservée aux comptes propriétaire et agence.</p>
        <Link className="button" href="/espace">
          Mon espace
        </Link>
      </main>
    );
  if (fetching)
    return (
      <main className="section">
        <div className="skeleton" />
      </main>
    );
  if (id && !property)
    return (
      <main className="section empty">
        <p className="error" role="alert">
          {error}
        </p>
        <Link href="/espace" className="button">
          Retour à mon espace
        </Link>
      </main>
    );
  const p = property;
  return (
    <main className="section property-editor">
      <Link href="/espace" className="text-link">
        <ArrowLeft size={16} />
        Retour à mon espace
      </Link>
      <div className="page-intro">
        <span className="eyebrow">UNE NOUVELLE RENCONTRE COMMENCE ICI</span>
        <h1>{id ? "Soignez chaque détail." : "Présentez votre bien."}</h1>
        <p>
          Des informations précises et de belles images aident vos futurs
          clients à se projeter.
        </p>
      </div>
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          const input: Record<string, unknown> = {};
          for (const key of [
            "title",
            "description",
            "transaction",
            "type",
            "city",
            "district",
            "address",
            "panorama",
            "status",
          ])
            input[key] = String(d.get(key) || "");
          for (const key of [
            "price",
            "area",
            "bedrooms",
            "bathrooms",
            "latitude",
            "longitude",
          ])
            input[key] = Number(d.get(key));
          input.images = String(d.get("images"))
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          input.amenities = String(d.get("amenities"))
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          setBusy(true);
          setError("");
          try {
            await api(
              id ? `/properties/${id}` : "/properties",
              body(input, id ? "PATCH" : "POST"),
            );
            router.push("/espace");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section className="dashboard-panel">
          <h2>01. L’essentiel</h2>
          <div className="form-grid">
            <label className="full">
              Titre de l’annonce
              <input
                name="title"
                defaultValue={p?.title}
                required
                minLength={5}
                maxLength={150}
                placeholder="Ex. Villa lumineuse avec jardin à Cocody"
              />
            </label>
            <label>
              Type de bien
              <select name="type" defaultValue={p?.type || "apartment"}>
                {Object.entries(types).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Transaction
              <select
                name="transaction"
                defaultValue={p?.transaction || "rent"}
              >
                <option value="rent">Location</option>
                <option value="sale">Vente</option>
              </select>
            </label>
            <label>
              Prix en FCFA (mensuel si location)
              <input
                name="price"
                type="number"
                min="1"
                max="1000000000000"
                required
                defaultValue={p?.price}
              />
            </label>
            <label>
              Surface (m²)
              <input
                name="area"
                type="number"
                min="1"
                step="0.01"
                max="10000000"
                required
                defaultValue={p?.area}
              />
            </label>
            <label>
              Chambres
              <input
                name="bedrooms"
                type="number"
                min="0"
                max="100"
                required
                defaultValue={p?.bedrooms || 0}
              />
            </label>
            <label>
              Salles d’eau
              <input
                name="bathrooms"
                type="number"
                min="0"
                max="100"
                required
                defaultValue={p?.bathrooms || 0}
              />
            </label>
            <label className="full">
              Description
              <textarea
                name="description"
                rows={6}
                minLength={30}
                maxLength={6000}
                defaultValue={p?.description}
                required
                placeholder="Décrivez le bien, ses espaces, son environnement… (30 caractères minimum)"
              />
            </label>
            <label className="full">
              Équipements (séparés par des virgules)
              <input
                name="amenities"
                defaultValue={p?.amenities.join(", ")}
                placeholder="Parking, Piscine, Climatisation"
                maxLength={1000}
              />
            </label>
          </div>
        </section>
        <section className="dashboard-panel">
          <h2>02. L’adresse</h2>
          <div className="form-grid">
            <label>
              Ville
              <input
                name="city"
                defaultValue={p?.city || "Abidjan"}
                required
                maxLength={150}
              />
            </label>
            <label>
              Quartier
              <input
                name="district"
                defaultValue={p?.district}
                required
                maxLength={150}
              />
            </label>
            <label className="full">
              Adresse
              <input
                name="address"
                defaultValue={p?.address}
                required
                maxLength={150}
              />
            </label>
            <label>
              Latitude
              <input
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                defaultValue={p?.latitude ?? 5.35}
                required
              />
            </label>
            <label>
              Longitude
              <input
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                defaultValue={p?.longitude ?? -3.98}
                required
              />
            </label>
            <p className="small-note full">
              Ces coordonnées placent le repère sur la carte. Vérifiez-les avant
              publication.
            </p>
          </div>
        </section>
        <section className="dashboard-panel">
          <h2>03. Les images et la visite</h2>
          <div className="stack">
            <label>
              Photos : une URL HTTPS par ligne (1 à 12)
              <textarea
                name="images"
                rows={4}
                required
                defaultValue={p?.images.join("\n")}
                placeholder="https://votre-hebergeur.ci/salon.jpg"
              />
            </label>
            <p className="small-note">
              Utilisez les liens directs d’images que vous êtes autorisé à
              publier, hébergées sur un service accessible publiquement.
            </p>
            <label>
              Panorama 360° : URL HTTPS (facultatif)
              <input
                name="panorama"
                type="url"
                defaultValue={p?.panorama}
                placeholder="https://votre-hebergeur.ci/panorama.jpg"
              />
            </label>
            <p className="small-note">
              Image équirectangulaire au format 2:1, avec accès CORS autorisé
              par l’hébergeur.
            </p>
            <label>
              Visibilité
              <select name="status" defaultValue={p?.status || "published"}>
                <option value="published">Publier l’annonce</option>
                <option value="draft">Enregistrer en brouillon</option>
                <option value="archived">Archiver</option>
              </select>
            </label>
          </div>
        </section>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        <div className="editor-actions">
          <Link href="/espace" className="button secondary">
            Annuler
          </Link>
          <button className="button" disabled={busy}>
            <Save size={17} />
            {busy ? "Enregistrement…" : "Enregistrer mon annonce"}
          </button>
        </div>
      </form>
    </main>
  );
}
