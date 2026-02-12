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

    data.sort((a, b) => {
      const ta = Date.parse(a.datetime || "");
      const tb = Date.parse(b.datetime || "");
      return tb - ta;
    });

    const folded = foldConsecutiveBySpecies(data);
    const fragment = document.createDocumentFragment();
    for (const row of folded) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(row.datetime);
      tr.appendChild(tdDate);

      const tdSci = document.createElement("td");
      tdSci.className = "sci";
      tdSci.textContent = row.sci_name || "";
      tr.appendChild(tdSci);

      const tdCommon = document.createElement("td");
      const displayName = row.com_name || row.sci_name || "";
      const wikiUrl = wikipediaFrUrl(row.sci_name || "");
      if (wikiUrl) {
        const link = document.createElement("a");
        link.href = wikiUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-900";
        link.textContent = displayName;
        tdCommon.appendChild(link);
      } else {
        tdCommon.textContent = displayName;
      }
      if ((row.count || 1) > 1) {
        const count = document.createElement("span");
        count.className = "ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800";
        count.textContent = "x" + row.count;
        tdCommon.appendChild(count);
      }
      tr.appendChild(tdCommon);

      fragment.appendChild(tr);
    }

    tbody.replaceChildren(fragment);
    status.textContent =
      "Dernière détections d'oiseaux à Palaiseau - " + folded.length + " groupes charges.";
  } catch (err) {
    status.textContent = "Erreur: " + (err && err.message ? err.message : String(err));
  }
})();

function formatDate(value) {
  const ms = Date.parse(value || "");
  if (Number.isNaN(ms)) return value || "";
  return new Date(ms).toLocaleString();
}

function wikipediaFrUrl(scientificName) {
  const name = scientificName.trim();
  if (!name) return "";
  return "https://fr.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/\s+/g, "_"));
}

function foldConsecutiveBySpecies(rows) {
  const grouped = [];
  for (const row of rows) {
    const sci = (row && row.sci_name ? row.sci_name : "").trim();
    if (!sci) continue;

    const last = grouped[grouped.length - 1];
    if (last && last.sci_name === sci) {
      last.count += 1;
      continue;
    }

    grouped.push({
      datetime: row.datetime || "",
      sci_name: sci,
      com_name: (row.com_name || "").trim(),
      count: 1,
    });
  }
  return grouped;
}
