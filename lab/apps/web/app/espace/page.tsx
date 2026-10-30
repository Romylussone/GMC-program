"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Heart,
  Sparkles,
  SlidersHorizontal,
  Users,
  CalendarDays,
  LogOut,
  Plus,
  ArrowUpRight,
  Pencil,
  Archive,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { PropertyCard } from "@/components/property-card";
import {
  PreferencesPanel,
  LeadsPanel,
  AppointmentsPanel,
} from "@/components/dashboard-panels";
import { api } from "@/lib/api";
import { money, type Property, type Lead, type Appointment } from "@/lib/types";
type Stats = {
  properties: number;
  leads: number;
  visits: number;
  conversion: number;
};
export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pro = !!user && user.role !== "seeker";
  const [tab, setTab] = useState("overview");
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    properties: 0,
    leads: 0,
    visits: 0,
    conversion: 0,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [loadedTab, setLoadedTab] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision((n) => n + 1);
  const favoriteKey = user?.favorites.join(",");
  useEffect(() => {
    if (!loading && !user) router.replace("/connexion?next=/espace");
  }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBusy(true);
    setError("");
    const selected =
      tab === "overview" ? (pro ? "properties" : "recommendations") : tab;
    const load = async () => {
      try {
        if (
          selected === "properties" ||
          selected === "favorites" ||
          selected === "recommendations"
        ) {
          const result = await api<Property[]>(`/me/${selected}`);
          if (!cancelled) setProperties(result);
        }
        if (selected === "leads") {
          const result = await api<Lead[]>("/me/leads");
          if (!cancelled) setLeads(result);
        }
        if (selected === "appointments") {
          const result = await api<Appointment[]>("/me/appointments");
          if (!cancelled) setAppointments(result);
        }
        if (pro) {
          const result = await api<Stats>("/me/stats");
          if (!cancelled) setStats(result);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) {
          setBusy(false);
          setLoadedTab(tab);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, user?._id, pro, revision, favoriteKey]);
  if (loading || !user)
    return (
      <main className="section">
        <p>Chargement de votre espace…</p>
      </main>
    );
  const items = [
    { id: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
    ...(pro
      ? [{ id: "properties", label: "Mes annonces", icon: Building2 }]
      : []),
    { id: "favorites", label: "Mes favoris", icon: Heart },
    { id: "recommendations", label: "Pour moi", icon: Sparkles },
    { id: "leads", label: pro ? "Mes prospects" : "Mes messages", icon: Users },
    { id: "appointments", label: "Mes rendez-vous", icon: CalendarDays },
    { id: "preferences", label: "Mes préférences", icon: SlidersHorizontal },
  ];
  const title = items.find((i) => i.id === tab)?.label;
  const propertyTab = [
    "overview",
    "properties",
    "favorites",
    "recommendations",
  ].includes(tab);
  const ownList = pro && ["overview", "properties"].includes(tab);
  async function archive(id: string) {
    setError("");
    try {
      await api(`/properties/${id}`, { method: "DELETE" });
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <span className="eyebrow">VOTRE ESPACE</span>
          <h3>{user.name}</h3>
          <p>
            {pro ? "Professionnel de l’immobilier" : "Votre projet immobilier"}
          </p>
        </div>
        <nav>
          {items.map((i) => (
            <button
              key={i.id}
              className={tab === i.id ? "selected" : ""}
              onClick={() => setTab(i.id)}
            >
              <i.icon size={18} />
              {i.label}
            </button>
          ))}
        </nav>
        <button
          className="logout"
          onClick={async () => {
            try {
              await logout();
              router.push("/");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">
              CHAQUE PROJET COMMENCE PAR UNE RENCONTRE
            </span>
            <h1>
              {tab === "overview"
                ? `Bonjour, ${user.name.split(" ")[0]}.`
                : title}
            </h1>
            <p>
              {tab === "recommendations"
                ? "Des biens classés selon les critères de vos préférences."
                : pro
                  ? "Vos annonces, vos contacts et vos prochaines opportunités."
                  : "Un espace pour faire avancer votre recherche."}
            </p>
          </div>
          {pro && (
            <Link href="/espace/annonces/nouveau" className="button small">
              <Plus size={17} />
              Publier un bien
            </Link>
          )}
        </div>
        {pro && tab === "overview" && (
          <div className="stats">
            {[
              {
                label: "Annonces publiées",
                value: stats.properties,
                icon: Building2,
              },
              {
                label: "Prospects intéressés",
                value: stats.leads,
                icon: Users,
              },
              {
                label: "Visites à venir",
                value: stats.visits,
                icon: CalendarDays,
              },
              {
                label: "Taux de conversion",
                value: `${stats.conversion}%`,
                icon: ArrowUpRight,
              },
            ].map((s) => (
              <div key={s.label}>
                <s.icon size={20} />
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div role="alert" className="notice error">
            {error}
            <button className="text-link" onClick={reload}>
              <RefreshCw size={15} />
              Réessayer
            </button>
          </div>
        )}
        {tab === "preferences" ? (
          <PreferencesPanel onSave={reload} />
        ) : busy && loadedTab !== tab ? (
          <div className="skeleton" />
        ) : propertyTab ? (
          <>
            <div className="results-toolbar">
              <h2>
                {ownList
                  ? "Votre portefeuille"
                  : tab === "favorites"
                    ? "Vos coups de cœur"
                    : "Sélection pour votre projet"}
              </h2>
              <span>
                {properties.length} bien{properties.length > 1 ? "s" : ""}
              </span>
            </div>
            {!properties.length ? (
              <div className="empty">
                <Building2 size={32} />
                <h2>
                  {ownList
                    ? "Votre première annonce vous attend."
                    : "Votre sélection commence ici."}
                </h2>
                <p>
                  {ownList
                    ? "Présentez votre bien et rencontrez vos futurs clients."
                    : "Explorez les annonces ou ajustez vos préférences pour trouver votre prochain chez-vous."}
                </p>
                <Link
                  className="button"
                  href={ownList ? "/espace/annonces/nouveau" : "/biens"}
                >
                  {ownList ? "Publier un bien" : "Explorer les biens"}
                </Link>
              </div>
            ) : ownList ? (
              <div className="own-properties">
                {properties.map((p) => (
                  <article className="own-property" key={p._id}>
                    <img src={p.images[0]} alt={p.title} />
                    <div>
                      <span className={`status ${p.status}`}>
                        {
                          (
                            {
                              published: "Publiée",
                              draft: "Brouillon",
                              archived: "Archivée",
                            } as Record<string, string>
                          )[p.status]
                        }
                      </span>
                      <h3>{p.title}</h3>
                      <p>
                        {p.district} · {money(p.price)} FCFA
                        {p.transaction === "rent" ? " / mois" : ""}
                      </p>
                    </div>
                    <div className="own-actions">
                      <Link
                        className="button secondary small"
                        href={`/espace/annonces/${p._id}`}
                      >
                        <Pencil size={15} />
                        Modifier
                      </Link>
                      {p.status !== "archived" && (
                        <button
                          className="icon-button"
                          title="Archiver l’annonce"
                          aria-label={`Archiver ${p.title}`}
                          onClick={() => void archive(p._id)}
                        >
                          <Archive size={17} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="property-grid dashboard-grid">
                {properties.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
            )}
          </>
        ) : tab === "leads" ? (
          <LeadsPanel leads={leads} reload={reload} />
        ) : (
          <AppointmentsPanel appointments={appointments} reload={reload} />
        )}
      </div>
    </main>
  );
}
