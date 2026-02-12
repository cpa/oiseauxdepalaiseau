(async function main() {
  const status = document.getElementById("status");
  const tbody = document.getElementById("rows");
  const dataUrl = "https://cpa.github.io/oiseauxdemassy/birddb.json";

  try {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Echec du chargement JSON (" + res.status + ")");
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Le JSON doit etre un tableau.");
    }

    const fragment = document.createDocumentFragment();
    for (const row of data) {
      const card = document.createElement("article");
      card.className = "bird-row";

      const date = document.createElement("div");
      date.className = "bird-date";
      date.textContent = formatDate(row.datetime);
      card.appendChild(date);

      const main = document.createElement("div");
      main.className = "bird-main";
      const displayName = row.com_name || row.sci_name || "";
      const wikiUrl = wikipediaFrUrl(row.sci_name || "");
      if (wikiUrl) {
        const link = document.createElement("a");
        link.href = wikiUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-900";
        link.textContent = displayName;
        main.appendChild(link);
      } else {
        main.textContent = displayName;
      }
      if ((row.count || 1) > 1) {
        const count = document.createElement("span");
        count.className = "ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800";
        count.textContent = "x" + row.count;
        main.appendChild(count);
      }
      const sci = document.createElement("div");
      sci.className = "bird-sci";
      sci.textContent = row.sci_name || "";
      main.appendChild(sci);
      card.appendChild(main);

      fragment.appendChild(card);
    }

    tbody.replaceChildren(fragment);
    status.textContent = "Les oiseaux de Palaiseau - " + data.length + " détections.";
  } catch (err) {
    status.textContent = "Erreur: " + (err && err.message ? err.message : String(err));
  }
})();

function formatDate(value) {
  const ms = Date.parse(value || "");
  if (Number.isNaN(ms)) return value || "";
  return new Date(ms).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function wikipediaFrUrl(scientificName) {
  const name = scientificName.trim();
  if (!name) return "";
  return "https://fr.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/\s+/g, "_"));
}
