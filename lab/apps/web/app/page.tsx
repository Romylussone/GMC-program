"use client";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Compass,
  MapPin,
  Rotate3D,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Property } from "@/lib/types";
import { SearchForm } from "@/components/search-form";
import { PropertyCard } from "@/components/property-card";
export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ items: Property[] }>("/properties?limit=3")
      .then((r) => setProperties(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> L’IMMOBILIER, UNE NOUVELLE
            PERSPECTIVE
          </span>
          <h1>
            La bonne adresse.
            <br />
            Pour votre{" "}
            <em>
              prochaine
              <br className="desktop-break" /> histoire.
            </em>
          </h1>
          <p>
            Un premier chez-vous, un nouveau départ, un bel investissement.
            <br className="desktop-break" /> Trouvez le lieu qui vous ressemble,
            en Côte d’Ivoire.
          </p>
          <div className="hero-proof">
            <span className="proof-icon">
              <Compass size={19} />
            </span>
            <span>
              Explorez autrement.
              <br />
              <strong>Projetez-vous avant de vous déplacer.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1500&q=90"
            alt="Villa contemporaine ouverte sur un jardin avec piscine"
            fetchPriority="high"
          />
          <div className="hero-caption">
            <span>
              <MapPin size={14} />
              Abidjan, Côte d’Ivoire
            </span>
            <span>
              Des lieux à vivre <ArrowUpRight size={15} />
            </span>
          </div>
          <div className="floating-note">
            <span className="round-icon">
              <Rotate3D size={24} />
            </span>
            <div>
              Entrez. Explorez. Imaginez.
              <small>Vos visites à 360°, où que vous soyez.</small>
            </div>
          </div>
          <span className="visual-index">01 — L’ART D’HABITER</span>
        </div>
        <SearchForm />
      </section>
      <div className="trust-strip">
        <span>Votre recherche, en toute simplicité</span>
        <span>
          <Rotate3D size={18} />
          Visites immersives à 360°
        </span>
        <span>
          <SlidersHorizontal size={18} />
          Recommandations personnalisées
        </span>
        <span>
          <CalendarDays size={18} />
          Visites sur rendez-vous
        </span>
      </div>
      <section className="section listings">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DE BELLES ADRESSES VOUS ATTENDENT</span>
            <h2>Un lieu. Un coup de cœur.</h2>
            <p>Découvrez une sélection de biens à explorer dès aujourd’hui.</p>
          </div>
          <Link className="text-link" href="/biens">
            Voir tous les biens <ArrowUpRight size={18} />
          </Link>
        </div>
        {error ? (
          <div className="notice error" role="alert">
            {error}
            <button className="text-link" onClick={() => location.reload()}>
              Réessayer
            </button>
          </div>
        ) : loading ? (
          <div className="property-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton" />
            ))}
          </div>
        ) : properties.length ? (
          <div className="property-grid">
            {properties.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        ) : (
          <div className="empty">Les premières annonces arrivent bientôt.</div>
        )}
      </section>
      <section className="experience">
        <div className="experience-image">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
            alt="Salon lumineux et chaleureux"
            loading="lazy"
          />
          <span className="experience-label">
            <Rotate3D size={20} /> UN AUTRE REGARD SUR L’IMMOBILIER
          </span>
        </div>
        <div className="experience-copy">
          <span className="eyebrow">PRENEZ LE TEMPS DE VOUS PROJETER</span>
          <h2>
            Votre première visite.
            <br />
            <em>Depuis votre canapé.</em>
          </h2>
          <p>
            Déplacez-vous dans les espaces, découvrez les volumes et
            laissez-vous inspirer. Avec les visites à 360°, votre recherche
            prend une nouvelle dimension.
          </p>
          <Link href="/biens?tour=true" className="button">
            Explorer les visites virtuelles <ArrowUpRight size={18} />
          </Link>
          <span className="small-note">
            Repérez l’icône 360° sur les annonces compatibles.
          </span>
        </div>
      </section>
      <section className="section how">
        <div className="section-heading">
          <div>
            <span className="eyebrow">VOTRE PROJET, PAS À PAS</span>
            <h2>De l’envie à la bonne adresse.</h2>
          </div>
          <ArrowDown size={27} />
        </div>
        <div className="steps">
          {[
            {
              icon: Compass,
              title: "Trouvez votre inspiration",
              text: "Choisissez le quartier, le budget et les espaces qui correspondent à votre quotidien.",
            },
            {
              icon: Rotate3D,
              title: "Explorez à votre rythme",
              text: "Parcourez les annonces, visitez à 360° et gardez vos coups de cœur dans vos favoris.",
            },
            {
              icon: CalendarDays,
              title: "Rencontrons-nous sur place",
              text: "Échangez avec le professionnel et réservez un créneau pour découvrir votre futur lieu de vie.",
            },
          ].map((s, i) => (
            <div key={s.title}>
              <span className="step-number">0{i + 1}</span>
              <s.icon size={28} />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="pro-banner">
        <div>
          <span className="eyebrow">VOUS ÊTES PROPRIÉTAIRE OU AGENT ?</span>
          <h2>
            Vos biens méritent
            <br />
            de belles rencontres.
          </h2>
          <p>
            Publiez vos annonces, suivez vos prospects et organisez vos visites
            depuis un seul espace.
          </p>
        </div>
        <Link href="/inscription?role=agency" className="button light">
          Créer mon espace professionnel <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
