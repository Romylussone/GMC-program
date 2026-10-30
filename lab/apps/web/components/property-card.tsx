"use client";
import Link from "next/link";
import {
  BedDouble,
  Expand,
  Heart,
  MapPin,
  MoveUpRight,
  Rotate3D,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money, types, type Property } from "@/lib/types";
import { useAuth } from "./providers";
export function PropertyCard({ property: p }: { property: Property }) {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const favorite = user?.favorites.includes(p._id);
  async function toggle() {
    if (!user) {
      router.push("/connexion");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/me/favorites/${p._id}`, {
        method: favorite ? "DELETE" : "PUT",
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="property-card">
      <div className="card-image">
        <Link href={`/biens/${p._id}`} tabIndex={-1}>
          <img src={p.images[0]} alt={p.title} loading="lazy" />
        </Link>
        <div className="card-badges">
          <span className="badge">
            {p.transaction === "rent" ? "À louer" : "À vendre"}
          </span>
          {p.panorama && (
            <span className="badge dark">
              <Rotate3D size={13} /> Visite 360°
            </span>
          )}
        </div>
        <button
          className={`favorite ${favorite ? "selected" : ""}`}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={!!favorite}
          disabled={busy}
          onClick={toggle}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-location">
          <MapPin size={13} />
          {p.district}, {p.city}
        </div>
        <Link href={`/biens/${p._id}`}>
          <h3>{p.title}</h3>
        </Link>
        <div className="card-details">
          <span>{types[p.type]}</span>
          <span>
            <BedDouble size={15} />
            {p.bedrooms} ch.
          </span>
          <span>
            <Expand size={14} />
            {p.area} m²
          </span>
        </div>
        <div className="card-bottom">
          <p>
            <strong>{money(p.price)}</strong>{" "}
            <span>FCFA{p.transaction === "rent" && " / mois"}</span>
          </p>
          <Link
            href={`/biens/${p._id}`}
            className="round-link"
            aria-label={`Voir ${p.title}`}
          >
            <MoveUpRight size={17} />
          </Link>
        </div>
        {p.score !== undefined && (
          <div className="match">
            {p.score}% de correspondance · {p.reasons?.slice(0, 2).join(" · ")}
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
