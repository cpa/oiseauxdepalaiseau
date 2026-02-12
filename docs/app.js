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
      date.textContent = formatDetectionWindow(row.datetime_start, row.datetime_end);
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
      const sci = document.createElement("div");
      sci.className = "bird-sci";
      sci.textContent = row.sci_name || "";
      main.appendChild(sci);
      card.appendChild(main);

      fragment.appendChild(card);
    }

    tbody.replaceChildren(fragment);
    status.textContent = "Les oiseaux de Palaiseau";
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

function formatDetectionWindow(startValue, endValue) {
  const startMs = Date.parse(startValue || "");
  const endMs = Date.parse(endValue || "");
  if (Number.isNaN(startMs) && Number.isNaN(endMs)) return "";
  if (Number.isNaN(startMs)) return formatDate(endValue);
  if (Number.isNaN(endMs)) return formatDate(startValue);

  const start = new Date(startMs);
  const end = new Date(endMs);
  const startText = formatDate(startValue);
  const endText = formatDate(endValue);
  if (startText === endText) return startText;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (!sameDay) return startText + " → " + endText;

  const dayText = start.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startTime = start.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (startTime === endTime) return dayText + " " + startTime;
  return dayText + " " + startTime + " → " + endTime;
}

function wikipediaFrUrl(scientificName) {
  const name = scientificName.trim();
  if (!name) return "";
  return "https://fr.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/\s+/g, "_"));
}
