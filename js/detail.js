// ---------- Indstillinger ----------
const API_BASE = "https://pokeapi.co/api/v2";
const SIDSTE_ID = 151; // Den sidste Pokémon der vises på forsiden

// Farver for de forskellige Pokémon-typer
const TYPE_COLORS = {
  bug: "#A7B723",
  dark: "#75574C",
  dragon: "#7037FF",
  electric: "#F9CF30",
  fairy: "#E69EAC",
  fighting: "#C12239",
  fire: "#F57D31",
  flying: "#A891EC",
  ghost: "#70559B",
  normal: "#AAA67F",
  grass: "#74CB48",
  ground: "#DEC16B",
  ice: "#9AD6DF",
  poison: "#A43E9E",
  psychic: "#FB5584",
  rock: "#B69E31",
  steel: "#B7B9D0",
  water: "#6493EB",
};

// Forkortelser til de forskellige stats
const STAT_LABELS = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SATK",
  "special-defense": "SDEF",
  speed: "SPD",
};

// ---------- Elementer fra HTML ----------
const root = document.getElementById("root");

// ---------- Hjælpefunktioner ----------
// Laver "bulbasaur" om til "Bulbasaur"
function stortStartbogstav(tekst) {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

// Laver 1 om til "#001"
function lavNummer(id) {
  return "#" + String(id).padStart(3, "0");
}

// Henter Pokémon-navnet fra URL'en (detail.html?name=pikachu)
function hentNavnFraUrl() {
  const params = new URLSearchParams(window.location.search);
  const navn = params.get("name") || "";
  return navn.toLowerCase().trim();
}

// ---------- Beskeder ----------
// Viser en besked mens der indlæses
function visIndlaeser() {
  root.innerHTML = `
    <div class="dex">
      <div class="dex-header">
        <div class="detail-header">
          <a class="back-link" href="index.html">←</a>
          <h1 class="detail-title">Indlæser…</h1>
        </div>
      </div>
      <div class="dex-body"></div>
    </div>
  `;
}

// Viser en fejlbesked
function visFejl(besked) {
  root.innerHTML = `
    <div class="dex">
      <div class="dex-header">
        <div class="detail-header">
          <a class="back-link" href="index.html">←</a>
          <h1 class="detail-title">Ikke fundet</h1>
        </div>
      </div>
      <div class="dex-body">
        <p class="error-state">${besked}</p>
      </div>
    </div>
  `;
}

// ---------- Hent data fra API'et ----------
// Henter en Pokémon (virker både med navn og nummer)
async function hentPokemon(navnEllerId) {
  const svar = await fetch(`${API_BASE}/pokemon/${navnEllerId}`);

  if (!svar.ok) {
    throw new Error("Pokémon ikke fundet");
  }

  return svar.json();
}

// Henter Pokémonens beskrivelse (den engelske tekst)
async function hentBeskrivelse(artUrl) {
  try {
    const svar = await fetch(artUrl);
    const data = await svar.json();

    // Find den første tekst der er på engelsk
    for (const tekst of data.flavor_text_entries) {
      if (tekst.language.name === "en") {
        // Fjerner linjeskift og specialtegn fra teksten
        return tekst.flavor_text.replace(/[\n\f\u00ad]/g, " ");
      }
    }
    return "";
  } catch (fejl) {
    return "";
  }
}

// ---------- Lav en stat-bar ----------
function lavStatBar(stat, farve) {
  // Regn ud hvor bred baren skal være (max 100%)
  let procent = Math.round((stat.base_stat / 180) * 100);
  if (procent > 100) {
    procent = 100;
  }

  const navn = STAT_LABELS[stat.stat.name] || stat.stat.name;

  return `
    <div class="stat-row">
      <span class="stat-name" style="color:${farve};">${navn}</span>
      <span>${String(stat.base_stat).padStart(3, "0")}</span>
      <span class="stat-bar-track">
        <span class="stat-bar-fill" style="width:${procent}%; background:${farve};"></span>
      </span>
    </div>
  `;
}

// ---------- Vis detaljesiden ----------
async function visDetaljer(navn) {
  visIndlaeser();

  // 1. Hent Pokémonen
  let data;

  try {
    data = await hentPokemon(navn);
  } catch (fejl) {
    visFejl("Vi kunne ikke finde denne Pokémon.");
    return;
  }

  // 2. Hent beskrivelsen
  const beskrivelse = await hentBeskrivelse(data.species.url);

  // 3. Find farven ud fra Pokémonens første type
  const farve = TYPE_COLORS[data.types[0].type.name] || "#DC0A2D";

  // 4. Find billedet
  const billede = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`;

  // 5. Lav pilene til forrige og næste Pokémon
  let forrigeHtml = `<span class="detail-nav prev disabled">‹</span>`;
  if (data.id > 1) {
    forrigeHtml = `<a class="detail-nav prev" href="detail.html?name=${data.id - 1}">‹</a>`;
  }

  let naesteHtml = `<span class="detail-nav next disabled">›</span>`;
  if (data.id < SIDSTE_ID) {
    naesteHtml = `<a class="detail-nav next" href="detail.html?name=${data.id + 1}">›</a>`;
  }

  // 6. Lav type-mærkaterne
  let typerHtml = "";
  for (const t of data.types) {
    const typeFarve = TYPE_COLORS[t.type.name] || "#888";
    typerHtml += `<span class="type-badge" style="background:${typeFarve};">${t.type.name}</span>`;
  }

  // 7. Lav de to første moves
  const moves = data.moves
    .slice(0, 2)
    .map((m) => stortStartbogstav(m.move.name.replace(/-/g, " ")))
    .join("<br/>");

  // 8. Lav alle stat-bars
  let statsHtml = "";
  for (const s of data.stats) {
    statsHtml += lavStatBar(s, farve);
  }

  // 9. Sæt det hele ind på siden
  root.innerHTML = `
    <div class="dex" style="--body-accent:${farve};">
      <div class="dex-header" style="background:${farve};">

        <div class="detail-header">
          <a class="back-link" href="index.html">←</a>
          <h1 class="detail-title">${stortStartbogstav(data.name)}</h1>
          <span class="detail-id">${lavNummer(data.id)}</span>
        </div>

        <div class="detail-hero">
          ${forrigeHtml}
          <img src="${billede}" alt="${stortStartbogstav(data.name)}" />
          ${naesteHtml}
        </div>
      </div>

      <div class="dex-body">

        <div class="type-badges">${typerHtml}</div>

        <h2 class="section-title" style="color:${farve};">About</h2>

        <div class="about-grid">

          <div class="about-item">
            <img src="weight.png" alt="" style="display:block; margin:0 auto 4px;" />
            <span class="value">${(data.weight / 10).toFixed(1)} kg</span>
            <span class="label">Weight</span>
          </div>

          <div class="about-item">
            <img src="straighten.png" alt="" style="display:block; margin:0 auto 4px;" />
            <span class="value">${(data.height / 10).toFixed(1)} m</span>
            <span class="label">Height</span>
          </div>

          <div class="about-item">
            <span class="value">${moves || "—"}</span>
            <span class="label">Moves</span>
          </div>
        </div>

        <p class="flavor-text">${beskrivelse || "Ingen beskrivelse tilgængelig."}</p>

        <h2 class="section-title" style="color:${farve};">Base Stats</h2>

        <div class="stats">${statsHtml}</div>
      </div>
    </div>
  `;
}

// ---------- Start ----------
const navn = hentNavnFraUrl();

if (navn === "") {
  visFejl("Ingen Pokémon angivet i URL'en.");
} else {
  visDetaljer(navn);
}