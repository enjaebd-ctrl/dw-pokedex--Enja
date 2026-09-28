// ---------- Config ----------
const API_BASE = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 24;
const SPRITE_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// ---------- State ----------
const STORAGE_KEY = "pokedexListState";

const state = {
  items: [], // { id, name, url }
  offset: 0,
  hasMore: true,
  loading: false,
  sortBy: "number", // "number" | "name"
  search: "",
  sortPopoverOpen: false,
  extraResult: null,
};

function saveState() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: state.items,
        offset: state.offset,
        hasMore: state.hasMore,
        sortBy: state.sortBy,
        search: state.search,
        scrollY: window.scrollY,
      })
    );
  } catch (err) {
    // sessionStorage unavailable — ignore
  }
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);

    if (!saved || !Array.isArray(saved.items) || saved.items.length === 0) {
      return null;
    }

    state.items = saved.items;
    state.offset = saved.offset || 0;
    state.hasMore = saved.hasMore !== false;
    state.sortBy = saved.sortBy || "number";
    state.search = saved.search || "";

    return saved.scrollY || 0;
  } catch (err) {
    return null;
  }
}

// ---------- Helpers ----------
function idFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function formatId(id) {
  return `#${String(id).padStart(3, "0")}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- Data fetching ----------
async function fetchNextPage() {
  if (state.loading || !state.hasMore) return;

  state.loading = true;
  renderGridOnly();

  try {
    const res = await fetch(
      `${API_BASE}/pokemon?limit=${PAGE_SIZE}&offset=${state.offset}`
    );

    if (!res.ok) throw new Error("Netværksfejl");

    const data = await res.json();

    const newItems = data.results.map((p) => ({
      id: idFromUrl(p.url),
      name: p.name,
      url: p.url,
    }));

    state.items.push(...newItems);
    state.offset += PAGE_SIZE;
    state.hasMore = Boolean(data.next);
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    renderGridOnly();
    saveState();
  }
}

async function tryFallbackSearch(query) {
  const clean = query.trim().replace(/^#/, "").toLowerCase();

  if (!clean) return;

  try {
    const res = await fetch(`${API_BASE}/pokemon/${clean}`);

    if (!res.ok) return;

    const data = await res.json();

    state.extraResult = {
      id: data.id,
      name: data.name,
      url: `${API_BASE}/pokemon/${data.id}/`,
    };

    renderGridOnly();
  } catch (err) {
    // Pokémonen findes ikke
  }
}

// ---------- Derived list ----------
function getVisibleItems() {
  let items = state.items.slice();
  const q = state.search.trim().toLowerCase();

  if (q) {
    const isNumberSearch = q.startsWith("#") || /^\d+$/.test(q);
    const cleanQ = q.replace(/^#/, "");

    items = items.filter((p) => {
      if (isNumberSearch) {
        return String(p.id).padStart(3, "0").includes(cleanQ);
      }

      return p.name.toLowerCase().includes(q);
    });

    if (
      items.length === 0 &&
      state.extraResult &&
      (String(state.extraResult.id).includes(cleanQ) ||
        state.extraResult.name.toLowerCase().includes(q))
    ) {
      items = [state.extraResult];
    }
  }

  items.sort((a, b) =>
    state.sortBy === "name"
      ? a.name.localeCompare(b.name)
      : a.id - b.id
  );

  return items;
}

// ---------- Rendering ----------
function render() {
  const root = document.getElementById("root");

  root.innerHTML = `
    <div class="dex">
      <div class="dex-header">
        <h1 class="dex-title">
          ${pokeballSvg()}
          Pokédex
        </h1>

        <div class="search-row">
          <div class="search-box">
            ${searchIconSvg()}

            <input
              id="search-input"
              type="text"
              placeholder="Search"
              value="${escapeHtml(state.search)}"
              autocomplete="off"
            />

            <button
              class="search-clear ${state.search ? "" : "hidden"}"
              id="clear-btn"
              aria-label="Ryd søgning"
              style="${state.search ? "" : "display:none;"}"
            >${clearIconSvg()}</button>
          </div>

          <button class="sort-toggle" id="sort-toggle" aria-label="Sortér">
            ${state.sortBy === "name" ? "A" : "#"}
          </button>
        </div>

        <div
          class="sort-popover ${state.sortPopoverOpen ? "" : "hidden"}"
          id="sort-popover"
        >
          <p class="sort-popover-title">Sort by:</p>

          <div class="sort-popover-panel">
            <label class="sort-option">
              <span class="radio-outer">
                <input
                  type="radio"
                  name="sort"
                  value="number"
                  ${state.sortBy === "number" ? "checked" : ""}
                />
                <span class="radio-dot"></span>
              </span>
              Number
            </label>

            <label class="sort-option">
              <span class="radio-outer">
                <input
                  type="radio"
                  name="sort"
                  value="name"
                  ${state.sortBy === "name" ? "checked" : ""}
                />
                <span class="radio-dot"></span>
              </span>
              Name
            </label>
          </div>
        </div>
      </div>

      <div class="dex-body">
        <div class="pokemon-grid" id="pokemon-grid"></div>
      </div>
    </div>
  `;

  attachHeaderListeners();
  renderGridOnly();
}

function renderGridOnly() {
  const grid = document.getElementById("pokemon-grid");

  if (!grid) return;

  const items = getVisibleItems();

  if (items.length === 0 && !state.loading) {
    grid.innerHTML = `<div class="empty-state">Ingen Pokémon fundet.</div>`;
    return;
  }

  grid.innerHTML =
    items
      .map(
        (p) => `
      <a
        class="pokemon-card"
        href="detail.html?name=${encodeURIComponent(p.name)}"
      >
        <div class="pokemon-number">${formatId(p.id)}</div>

        <img
          data-src="${SPRITE_URL(p.id)}"
          alt="${capitalize(p.name)}"
        />

        <div class="pokemon-name">${capitalize(p.name)}</div>
      </a>`
      )
      .join("") +
    (state.loading
      ? `<div class="loading-state">Indlæser…</div>`
      : "");

  lazyLoadImages();
}

function attachHeaderListeners() {
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    state.extraResult = null;

    renderClearButtonAndGrid();

    const q = state.search.trim();

    if (q && getVisibleItems().length === 0) {
      tryFallbackSearch(q);
    }
  });

  searchInput.focus();

  searchInput.selectionStart = searchInput.selectionEnd =
    searchInput.value.length;

  const clearBtn = document.getElementById("clear-btn");

  clearBtn.addEventListener("click", () => {
    state.search = "";
    state.extraResult = null;
    render();
  });

  const sortToggle = document.getElementById("sort-toggle");

  sortToggle.addEventListener("click", () => {
    state.sortPopoverOpen = !state.sortPopoverOpen;
    render();
  });

  const popover = document.getElementById("sort-popover");

  popover.querySelectorAll('input[name="sort"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      render();
    });
  });
}

// Lukker sorteringsmenuen hvis man klikker udenfor
function handleOutsideClick(e) {
  if (!state.sortPopoverOpen) return;

  const insidePopover = e.target.closest("#sort-popover");
  const onToggle = e.target.closest("#sort-toggle");

  if (!insidePopover && !onToggle) {
    state.sortPopoverOpen = false;
    render();
  }
}

function renderClearButtonAndGrid() {
  const clearBtn = document.getElementById("clear-btn");

  if (clearBtn) {
    clearBtn.style.display = state.search ? "" : "none";
  }

  renderGridOnly();
}

// ---------- Lazy loading images ----------
let imageObserver;

function lazyLoadImages() {
  if (!("IntersectionObserver" in window)) {
    document
      .querySelectorAll("#pokemon-grid img[data-src]")
      .forEach((img) => {
        img.src = img.dataset.src;
      });

    return;
  }

  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;

            img.src = img.dataset.src;
            img.removeAttribute("data-src");

            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "200px" }
    );
  }

  document
    .querySelectorAll("#pokemon-grid img[data-src]")
    .forEach((img) => imageObserver.observe(img));
}

// ---------- Icons ----------
function pokeballSvg() {
  return `<svg class="pokeball-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7356 12C14.7356 13.578 13.4564 14.8571 11.8785 14.8571C10.3005 14.8571 9.02133 13.578 9.02133 12C9.02133 10.422 10.3005 9.14286 11.8785 9.14286C13.4564 9.14286 14.7356 10.422 14.7356 12Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8785 24C17.9239 24 22.9251 19.5296 23.757 13.7143H16.7287C16.0227 15.7118 14.1177 17.1429 11.8785 17.1429C9.63924 17.1429 7.73426 15.7118 7.02826 13.7143H0C0.831822 19.5296 5.8331 24 11.8785 24ZM7.02826 10.2857H0C0.831822 4.47035 5.8331 0 11.8785 0C17.9239 0 22.9251 4.47035 23.757 10.2857H16.7287C16.0227 8.28824 14.1177 6.85714 11.8785 6.85714C9.63924 6.85714 7.73426 8.28824 7.02826 10.2857ZM14.7356 12C14.7356 13.578 13.4564 14.8571 11.8785 14.8571C10.3005 14.8571 9.02133 13.578 9.02133 12C9.02133 10.422 10.3005 9.14286 11.8785 9.14286C13.4564 9.14286 14.7356 10.422 14.7356 12Z" fill="white"/>
  </svg>`;
}

function searchIconSvg() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function clearIconSvg() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Init ----------
document.addEventListener("click", handleOutsideClick);

const savedScrollY = loadState();
render();

if (savedScrollY !== null) {
  requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
} else {
  fetchNextPage();
}

// Gemmer listen og scroll-positionen når siden forlades
window.addEventListener("pagehide", saveState);




                                        //eksperemention
// function pokeballSvg() {
//   return `<svg class="pokeball-icon" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <circle cx="13" cy="13" r="11" fill="#fff"/>
//     <path d="M2 13a11 11 0 0 1 22 0" fill="#fff"/>
//     <path d="M2 13h9a2 2 0 0 0 4 0h9" stroke="#E3350D" stroke-width="1.6" fill="none"/>
//     <circle cx="13" cy="13" r="3" fill="#fff" stroke="#24292B" stroke-width="1.4"/>
//     <path d="M2 13a11 11 0 0 1 22 0h-9a2 2 0 0 0-4 0H2z" fill="#E3350D"/>
//   </svg>`;
// }

// function searchIconSvg() {
//   return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
//     <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
//   </svg>`;
// }

// function clearIconSvg() {
//   return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> 
//     <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/> 
//     <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/> 
//   </svg>`; 
// } 

