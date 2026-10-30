"use client";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function SearchForm() {
  const [transaction, setTransaction] = useState("rent");
  const router = useRouter();
  return (
    <div className="hero-search">
      <div className="search-tabs">
        <button
          className={transaction === "rent" ? "selected" : ""}
          onClick={() => setTransaction("rent")}
        >
          Je veux louer
        </button>
        <button
          className={transaction === "sale" ? "selected" : ""}
          onClick={() => setTransaction("sale")}
        >
          Je veux acheter
        </button>
      </div>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const query = new URLSearchParams({ transaction });
          for (const key of ["q", "type", "maxPrice"])
            if (data.get(key)) query.set(key, String(data.get(key)));
          router.push(`/biens?${query}`);
        }}
      >
        <label>
          <span>OÙ CHERCHEZ-VOUS ?</span>
          <div>
            <MapPin size={17} />
            <input
              name="q"
              placeholder="Ville, quartier…"
              aria-label="Ville ou quartier"
            />
          </div>
        </label>
        <label>
          <span>TYPE DE BIEN</span>
          <div>
            <select name="type" aria-label="Type de bien">
              <option value="">Tous les biens</option>
              <option value="apartment">Appartement</option>
              <option value="villa">Villa</option>
              <option value="house">Maison</option>
              <option value="land">Terrain</option>
              <option value="office">Bureau</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </label>
        <label>
          <span>VOTRE BUDGET</span>
          <div>
            <input
              name="maxPrice"
              type="number"
              min="1"
              placeholder="Maximum en FCFA"
              aria-label="Budget maximum en FCFA"
            />
          </div>
        </label>
        <button className="button" type="submit">
          <Search size={18} />
          Rechercher
        </button>
      </form>
    </div>
  );
}
