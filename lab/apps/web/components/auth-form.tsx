"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, House } from "lucide-react";
import { api, body } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "./providers";
export function AuthForm({ register = false }: { register?: boolean }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="auth-page">
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"
          alt="Intérieur contemporain"
        />
        <div>
          <span className="eyebrow">BIENVENUE CHEZ VOUS</span>
          <h1>
            Une adresse.
            <br />
            Mille possibilités.
          </h1>
          <p>La prochaine histoire commence avec vous.</p>
        </div>
      </div>
      <div className="auth-form">
        <House className="auth-house" size={30} />
        <span className="eyebrow">VOTRE ESPACE ARTPARTS</span>
        <h1>
          {register ? "Faisons connaissance." : "Heureux de vous retrouver."}
        </h1>
        <p>
          {register
            ? "Créez votre compte pour donner vie à votre projet."
            : "Connectez-vous et reprenez votre recherche."}
        </p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            setBusy(true);
            setError("");
            try {
              const user = await api<User>(
                `/auth/${register ? "register" : "login"}`,
                body(data),
              );
              setUser(user);
              const next = params.get("next");
              router.push(
                next?.startsWith("/") &&
                  !next.startsWith("//") &&
                  !next.includes("\\")
                  ? next
                  : "/espace",
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {register && (
            <>
              <label>
                Nom complet
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={150}
                />
              </label>
              <label>
                Je suis
                <select
                  name="role"
                  defaultValue={
                    ["owner", "agency"].includes(params.get("role") || "")
                      ? params.get("role")!
                      : "seeker"
                  }
                >
                  <option value="seeker">À la recherche d’un bien</option>
                  <option value="owner">Propriétaire</option>
                  <option value="agency">Une agence immobilière</option>
                </select>
              </label>
              <label>
                Téléphone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+225…"
                  maxLength={30}
                />
              </label>
            </>
          )}
          <label>
            Adresse email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="vous@exemple.ci"
            />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={10}
              maxLength={128}
            />
            {register && <small>Au moins 10 caractères.</small>}
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "Un instant…"
              : register
                ? "Créer mon compte"
                : "Me connecter"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <Link href={register ? "/connexion" : "/inscription"}>
            {register ? "Se connecter" : "Créer mon compte"}
          </Link>
        </p>
      </div>
    </main>
  );
}
