(async function main() {
  const status = document.getElementById("status");
  const tbody = document.getElementById("rows");
  const dataUrl = "https://cpa.github.io/oiseauxdemassy/birddb.json";

  try {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch JSON (" + res.status + ")");
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("JSON payload must be an array.");
    }

    data.sort((a, b) => {
      const ta = Date.parse(a.datetime || "");
      const tb = Date.parse(b.datetime || "");
      return tb - ta;
    });

    const fragment = document.createDocumentFragment();
    for (const row of data) {
      const tr = document.createElement("tr");

      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(row.datetime);
      tr.appendChild(tdDate);

      const tdSci = document.createElement("td");
      tdSci.className = "sci";
      tdSci.textContent = row.sci_name || "";
      tr.appendChild(tdSci);

      const tdCommon = document.createElement("td");
      tdCommon.textContent = row.com_name || "";
      tr.appendChild(tdCommon);

      const tdWiki = document.createElement("td");
      const wikiUrl = wikipediaUrl(row.sci_name || "");
      if (wikiUrl) {
        const link = document.createElement("a");
        link.href = wikiUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-900";
        link.textContent = "Open";
        tdWiki.appendChild(link);
      }
      tr.appendChild(tdWiki);

      const tdConfidence = document.createElement("td");
      const badge = document.createElement("span");
      badge.className =
        "inline-flex rounded-full bg-emerald-700 px-2 py-1 text-xs font-medium text-white";
      badge.textContent = formatConfidence(row.confidence);
      tdConfidence.appendChild(badge);
      tr.appendChild(tdConfidence);

      fragment.appendChild(tr);
    }

    tbody.replaceChildren(fragment);
    status.textContent = "Loaded " + data.length + " records.";
  } catch (err) {
    status.textContent = "Error: " + (err && err.message ? err.message : String(err));
  }
})();

function formatDate(value) {
  const ms = Date.parse(value || "");
  if (Number.isNaN(ms)) return value || "";
  return new Date(ms).toLocaleString();
}

function formatConfidence(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return num.toFixed(4);
}

function wikipediaUrl(scientificName) {
  const name = scientificName.trim();
  if (!name) return "";
  return "https://en.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/\s+/g, "_"));
}
