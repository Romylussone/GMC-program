"use client";
import { useState } from "react";
import { CalendarDays, Send, Save } from "lucide-react";
import { api, body } from "@/lib/api";
import { useAuth } from "./providers";
import {
  stages,
  types,
  visitStatuses,
  dateTime,
  type Lead,
  type Appointment,
  type Preferences,
  type User,
} from "@/lib/types";
export function PreferencesPanel({ onSave }: { onSave: () => void }) {
  const { user, setUser } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const prefs = user!.preferences;
  return (
    <div className="dashboard-panel">
      <h2>Un projet qui vous ressemble.</h2>
      <p>
        Ces critères servent à classer les biens par correspondance. Le score
        tient compte du budget, du lieu, du type et des chambres.
      </p>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          const input: Preferences = {
            city: String(d.get("city")),
            district: String(d.get("district")),
            transaction: d.get("transaction") as "rent" | "sale",
            type: String(d.get("type")),
            budget: Number(d.get("budget")),
            bedrooms: Number(d.get("bedrooms")),
          };
          setBusy(true);
          setError("");
          setSuccess("");
          try {
            setUser(await api<User>("/me/preferences", body(input, "PATCH")));
            onSave();
            setSuccess(
              "Préférences enregistrées. Vos recommandations sont à jour.",
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Ville
          <input
            name="city"
            defaultValue={prefs.city}
            required
            maxLength={150}
          />
        </label>
        <label>
          Quartier préféré
          <input
            name="district"
            defaultValue={prefs.district}
            maxLength={100}
            placeholder="Facultatif"
          />
        </label>
        <label>
          Mon projet
          <select name="transaction" defaultValue={prefs.transaction}>
            <option value="rent">Louer</option>
            <option value="sale">Acheter</option>
          </select>
        </label>
        <label>
          Type de bien
          <select name="type" defaultValue={prefs.type}>
            <option value="">Indifférent</option>
            {Object.entries(types).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Budget maximum en FCFA
          <input
            type="number"
            name="budget"
            defaultValue={prefs.budget}
            required
            min="1"
            max="1000000000000"
          />
        </label>
        <label>
          Chambres minimum
          <input
            type="number"
            name="bedrooms"
            defaultValue={prefs.bedrooms}
            required
            min="0"
            max="30"
          />
        </label>
        <div className="full">
          <button className="button" disabled={busy}>
            <Save size={16} />
            {busy ? "Enregistrement…" : "Enregistrer mes préférences"}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="success" role="status">
              {success}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
export function LeadsPanel({
  leads,
  reload,
}: {
  leads: Lead[];
  reload: () => void;
}) {
  const { user } = useAuth();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stageFilter, setStageFilter] = useState("");
  const shown = leads.filter((l) => !stageFilter || l.stage === stageFilter);
  const lead = shown.find((l) => l._id === selected) || shown[0];
  const own = lead?.owner._id === user!._id;
  async function mutate(path: string, data: unknown, method = "PATCH") {
    setBusy(true);
    setError("");
    try {
      await api(path, body(data, method));
      reload();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="results-toolbar">
        <p>
          {leads.length} conversation{leads.length > 1 ? "s" : ""}
        </p>
        <label className="sr-only" htmlFor="lead-filter">
          Filtrer les prospects
        </label>
        <select
          id="lead-filter"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(stages).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!lead ? (
        <div className="empty">
          <h2>Les échanges commencent ici.</h2>
          <p>Vos demandes et vos messages apparaîtront dans cet espace.</p>
        </div>
      ) : (
        <div className="inbox">
          <div className="conversation-list">
            {shown.map((l) => (
              <button
                key={l._id}
                onClick={() => {
                  setSelected(l._id);
                  setError("");
                }}
                className={l._id === lead._id ? "selected" : ""}
              >
                <div>
                  <strong>
                    {l.owner._id === user!._id ? l.seeker.name : l.owner.name}
                  </strong>
                  <span className={`status ${l.stage}`}>{stages[l.stage]}</span>
                </div>
                <span>{l.property?.title || "Annonce indisponible"}</span>
                <small>{l.messages.at(-1)?.body}</small>
              </button>
            ))}
          </div>
          <div className="conversation" key={lead._id}>
            <h3>{lead.property?.title || "Annonce indisponible"}</h3>
            <p className="muted">
              {own
                ? `${lead.seeker.name} · ${lead.seeker.email || ""} · ${lead.seeker.phone}`
                : lead.owner.name}
            </p>
            {own && (
              <div className="lead-controls">
                <label>
                  Qualification
                  <select
                    value={lead.stage}
                    disabled={busy}
                    onChange={(e) =>
                      void mutate(`/leads/${lead._id}`, {
                        stage: e.target.value,
                      })
                    }
                  >
                    {Object.entries(stages).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <form
                  className="stack"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const notes = String(
                      new FormData(e.currentTarget).get("notes"),
                    );
                    await mutate(`/leads/${lead._id}`, { notes });
                  }}
                >
                  <label>
                    Notes internes
                    <textarea
                      name="notes"
                      key={lead.notes}
                      defaultValue={lead.notes}
                      maxLength={4000}
                      rows={2}
                    />
                  </label>
                  <button className="text-link" disabled={busy}>
                    Enregistrer les notes <Save size={14} />
                  </button>
                </form>
              </div>
            )}
            <div className="messages">
              {lead.messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${m.sender === user!._id ? "mine" : ""}`}
                >
                  <p>{m.body}</p>
                  <small>{dateTime(m.sentAt)}</small>
                </div>
              ))}
            </div>
            <form
              className="reply"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const ok = await mutate(
                  `/leads/${lead._id}/messages`,
                  { message: new FormData(form).get("message") },
                  "POST",
                );
                if (ok) form.reset();
              }}
            >
              <label className="sr-only" htmlFor="reply">
                Votre réponse
              </label>
              <input
                id="reply"
                name="message"
                placeholder="Écrire un message…"
                required
                minLength={3}
                maxLength={2000}
              />
              <button
                className="button small"
                disabled={busy}
                aria-label="Envoyer la réponse"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export function AppointmentsPanel({
  appointments,
  reload,
}: {
  appointments: Appointment[];
  reload: () => void;
}) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function update(id: string, status: string) {
    setBusy(id);
    setError("");
    try {
      await api(`/appointments/${id}`, body({ status }, "PATCH"));
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!appointments.length ? (
        <div className="empty">
          <CalendarDays size={32} />
          <h2>Votre agenda est encore libre.</h2>
          <p>Les demandes de visite et leurs confirmations apparaîtront ici.</p>
        </div>
      ) : (
        <div className="appointments">
          {appointments.map((a) => {
            const own = a.owner._id === user!._id;
            const active = ["pending", "confirmed"].includes(a.status);
            return (
              <article className="appointment dashboard-panel" key={a._id}>
                <div className="date-tile">
                  <CalendarDays size={23} />
                  <strong>
                    {new Date(a.startsAt).toLocaleDateString("fr-CI", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Africa/Abidjan",
                    })}
                  </strong>
                  <span>
                    {new Date(a.startsAt).toLocaleTimeString("fr-CI", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Abidjan",
                    })}{" "}
                    GMT
                  </span>
                </div>
                <div className="appointment-info">
                  <span className={`status ${a.status}`}>
                    {visitStatuses[a.status]}
                  </span>
                  <h3>{a.property?.title || "Annonce indisponible"}</h3>
                  <p>
                    {own ? a.seeker.name : a.owner.name} ·{" "}
                    {own ? a.seeker.phone : a.owner.phone}
                  </p>
                  {a.message && <p>{a.message}</p>}
                </div>
                <div className="appointment-actions">
                  {own && a.status === "pending" && (
                    <button
                      className="button small"
                      disabled={busy === a._id}
                      onClick={() => void update(a._id, "confirmed")}
                    >
                      Confirmer
                    </button>
                  )}
                  {own &&
                    a.status === "confirmed" &&
                    new Date(a.startsAt).getTime() <= Date.now() && (
                      <button
                        className="button small"
                        disabled={busy === a._id}
                        onClick={() => void update(a._id, "completed")}
                      >
                        Marquer effectuée
                      </button>
                    )}
                  {active && (
                    <button
                      className="button secondary small"
                      disabled={busy === a._id}
                      onClick={() => void update(a._id, "cancelled")}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
