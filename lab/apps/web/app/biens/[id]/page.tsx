"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Expand,
  MapPin,
  Check,
  Rotate3D,
  X,
  CalendarDays,
  Send,
  Phone,
} from "lucide-react";
import { api, body } from "@/lib/api";
import { money, types, type Property } from "@/lib/types";
import { useAuth } from "@/components/providers";
const PropertyMap = dynamic(() => import("@/components/map"), { ssr: false });
export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");
  const [tour, setTour] = useState(false);
  const [image, setImage] = useState(0);
  const [tab, setTab] = useState("contact");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  useEffect(() => {
    api<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (!tour) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTour(false);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [tour]);
  if (error)
    return (
      <main className="section empty">
        <h1>Bien indisponible</h1>
        <p role="alert">{error}</p>
        <Link className="button" href="/biens">
          Revenir à la recherche
        </Link>
      </main>
    );
  if (!property)
    return (
      <main className="section">
        <div className="skeleton" />
      </main>
    );
  const p = property;
  const own = user?._id === p.owner._id;
  return (
    <main className="section detail">
      <Link href="/biens" className="text-link muted">
        <ArrowLeft size={16} />
        Retour aux biens
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">
            {types[p.type]} ·{" "}
            {p.transaction === "rent" ? "À LOUER" : "À VENDRE"}
          </span>
          <h1>{p.title}</h1>
          <p>
            <MapPin size={16} />
            {p.address}
          </p>
        </div>
        <div className="detail-price">
          <strong>
            {money(p.price)} <small>FCFA</small>
          </strong>
          <span>{p.transaction === "rent" ? "par mois" : "Prix de vente"}</span>
        </div>
      </div>
      <div className="gallery">
        <div className="main-photo">
          <img src={p.images[image]} alt={`${p.title}, vue ${image + 1}`} />
          {p.panorama && (
            <button
              className="button tour-button"
              onClick={() => setTour(true)}
            >
              <Rotate3D size={20} />
              Explorer à 360°
            </button>
          )}
        </div>
        <div className="thumbnails">
          {p.images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setImage(i)}
              className={i === image ? "selected" : ""}
              aria-label={`Voir la photo ${i + 1}`}
              aria-pressed={i === image}
            >
              <img src={src} alt={`Vue ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-columns">
        <div>
          <div className="property-specs">
            <span>
              <BedDouble />
              {p.bedrooms} chambres
            </span>
            <span>
              <Bath />
              {p.bathrooms} salles d’eau
            </span>
            <span>
              <Expand />
              {p.area} m²
            </span>
          </div>
          <section className="detail-section">
            <h2>Imaginez votre quotidien ici.</h2>
            <p className="description">{p.description}</p>
          </section>
          <section className="detail-section">
            <h2>Tout pour vous sentir bien.</h2>
            <div className="amenities">
              {p.amenities.map((a) => (
                <span key={a}>
                  <Check size={17} />
                  {a}
                </span>
              ))}
            </div>
          </section>
          <section className="detail-section">
            <h2>Une adresse à découvrir.</h2>
            <p>
              {p.district}, {p.city}
            </p>
            <PropertyMap properties={[p]} />
          </section>
        </div>
        <aside className="contact-panel">
          <span className="eyebrow">VOTRE INTERLOCUTEUR</span>
          <div className="agent">
            <div className="avatar">{p.owner.name.slice(0, 1)}</div>
            <div>
              <h3>{p.owner.name}</h3>
              <span>Professionnel de l’immobilier</span>
            </div>
          </div>
          {p.owner.phone && (
            <a className="agent-phone" href={`tel:${p.owner.phone}`}>
              <Phone size={16} />
              {p.owner.phone}
            </a>
          )}
          {own ? (
            <Link className="button" href={`/espace/annonces/${p._id}`}>
              Gérer mon annonce
            </Link>
          ) : !user ? (
            <div className="notice">
              <p>
                Connectez-vous pour échanger avec le professionnel ou organiser
                une visite.
              </p>
              <Link
                className="button"
                href={`/connexion?next=${encodeURIComponent(`/biens/${p._id}`)}`}
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div className="panel-tabs">
                <button
                  className={tab === "contact" ? "selected" : ""}
                  onClick={() => {
                    setTab("contact");
                    setNotice("");
                    setFormError("");
                  }}
                >
                  Contacter
                </button>
                <button
                  className={tab === "visit" ? "selected" : ""}
                  onClick={() => {
                    setTab("visit");
                    setNotice("");
                    setFormError("");
                  }}
                >
                  Planifier une visite
                </button>
              </div>
              <form
                key={tab}
                className="stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  setBusy(true);
                  setNotice("");
                  setFormError("");
                  try {
                    if (tab === "contact")
                      await api(
                        `/properties/${p._id}/leads`,
                        body({ message: data.get("message") }),
                      );
                    else
                      await api(
                        "/appointments",
                        body({
                          propertyId: p._id,
                          startsAt: `${data.get("date")}T${data.get("hour")}:00:00.000Z`,
                          message: data.get("message") || "",
                        }),
                      );
                    setNotice(
                      tab === "contact"
                        ? "Message envoyé. Retrouvez cet échange dans votre espace."
                        : "Demande de visite envoyée. Le professionnel pourra la confirmer.",
                    );
                    form.reset();
                  } catch (e) {
                    setFormError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {tab === "visit" && (
                  <>
                    <label>
                      Date de visite
                      <input
                        name="date"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        max={new Date(Date.now() + 90 * 86400000)
                          .toISOString()
                          .slice(0, 10)}
                        required
                      />
                    </label>
                    <label>
                      Heure (Abidjan, GMT)
                      <select name="hour" required>
                        {Array.from({ length: 11 }, (_, i) => i + 8).map(
                          (h) => (
                            <option key={h} value={String(h).padStart(2, "0")}>
                              {h}:00
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <p className="small-note">
                      Créneau d’une heure, sous réserve de confirmation.
                    </p>
                  </>
                )}
                <label>
                  Votre message
                  <textarea
                    name="message"
                    rows={4}
                    required={tab === "contact"}
                    minLength={tab === "contact" ? 3 : 0}
                    maxLength={2000}
                    placeholder={
                      tab === "contact"
                        ? "Bonjour, ce bien m’intéresse…"
                        : "Une précision pour votre visite ?"
                    }
                  />
                </label>
                <button className="button" disabled={busy}>
                  {tab === "contact" ? (
                    <Send size={16} />
                  ) : (
                    <CalendarDays size={16} />
                  )}{" "}
                  {busy
                    ? "Envoi…"
                    : tab === "contact"
                      ? "Envoyer mon message"
                      : "Demander une visite"}
                </button>
                {notice && (
                  <p className="success" role="status">
                    {notice} <Link href="/espace">Mon espace →</Link>
                  </p>
                )}
                {formError && (
                  <p className="error" role="alert">
                    {formError}
                  </p>
                )}
              </form>
            </>
          )}
        </aside>
      </div>
      {tour && (
        <dialog
          className="modal-backdrop"
          ref={(element) => {
            if (element && !element.open) element.showModal();
          }}
          onCancel={() => setTour(false)}
          aria-modal="true"
          aria-labelledby="tour-title"
        >
          <div className="tour-modal">
            <div className="modal-heading">
              <div>
                <h2 id="tour-title">Visite à 360°</h2>
                <p>
                  {p.panorama === "https://pannellum.org/images/alma.jpg"
                    ? "Glissez pour explorer · Démonstration : panorama illustratif indépendant du bien."
                    : "Glissez pour explorer · Panorama fourni par le professionnel."}
                </p>
              </div>
              <button
                className="icon-button"
                autoFocus
                onClick={() => setTour(false)}
                aria-label="Fermer la visite"
              >
                <X />
              </button>
            </div>
            <iframe
              title={`Visite panoramique : ${p.title}`}
              src={`https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${encodeURIComponent(p.panorama)}&autoLoad=true`}
              allowFullScreen
              referrerPolicy="no-referrer"
            />
            <p className="small-note">
              Pour une annonce réelle, le professionnel peut fournir son propre
              panorama équirectangulaire. Échap pour fermer.
            </p>
          </div>
        </dialog>
      )}
    </main>
  );
}
