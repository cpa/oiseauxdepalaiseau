(async function main() {
  const status = document.getElementById("status");
  const tbody = document.getElementById("rows");
  const dataUrl = "https://raw.githubusercontent.com/cpa/oiseauxdepalaiseau/refs/heads/main/birddb.json";

  try {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Echec du chargement JSON (" + res.status + ")");
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Le JSON doit etre un tableau.");
    }

    const uniqueSpecies = new Set(
      data.map((row) => (row.sci_name || "").trim()).filter((name) => name.length > 0)
    );
    const imagePromises = new Map();
    for (const sciName of uniqueSpecies) {
      imagePromises.set(sciName, getBirdImageUrl(sciName));
    }

    const fragment = document.createDocumentFragment();
    for (const row of data) {
      const card = document.createElement("article");
      card.className = "bird-row";

      const media = document.createElement("div");
      media.className = "bird-media";
      const image = document.createElement("img");
      image.className = "bird-image";
      image.alt = row.com_name || row.sci_name || "Oiseau";
      image.loading = "lazy";
      image.decoding = "async";
      media.appendChild(image);
      card.appendChild(media);

      const content = document.createElement("div");
      content.className = "bird-content";

      const date = document.createElement("div");
      date.className = "bird-date";
      date.textContent = formatDetectionWindow(row.datetime_start, row.datetime_end);
      content.appendChild(date);

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
      content.appendChild(main);
      card.appendChild(content);

      const sciKey = (row.sci_name || "").trim();
      const imagePromise = imagePromises.get(sciKey);
      if (imagePromise) {
        imagePromise.then((url) => {
          if (url) {
            image.src = url;
            image.classList.add("is-ready");
          } else {
            image.classList.add("is-missing");
          }
        });
      } else {
        image.classList.add("is-missing");
      }

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

  const fromMs = Math.min(startMs, endMs);
  const toMs = Math.max(startMs, endMs);
  const from = new Date(fromMs);
  const to = new Date(toMs);
  const fromText = formatDate(from.toISOString());
  const toText = formatDate(to.toISOString());
  if (fromText === toText) return fromText;

  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();

  if (!sameDay) return fromText + " → " + toText;

  const dayText = from.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const fromTime = from.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const toTime = to.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (fromTime === toTime) return dayText + " " + fromTime;
  return dayText + " " + fromTime + " → " + toTime;
}

function wikipediaFrUrl(scientificName) {
  const name = scientificName.trim();
  if (!name) return "";
  return "https://fr.wikipedia.org/wiki/" + encodeURIComponent(name.replace(/\s+/g, "_"));
}

async function getBirdImageUrl(scientificName) {
  const wikiImage = await getWikipediaFrImage(scientificName);
  if (wikiImage) return wikiImage;
  return getFlickrImage(scientificName);
}

async function getWikipediaFrImage(scientificName) {
  try {
    const title = encodeURIComponent(scientificName.trim().replace(/\s+/g, "_"));
    if (!title) return "";
    const url = "https://fr.wikipedia.org/api/rest_v1/page/summary/" + title;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return "";
    const payload = await res.json();
    const thumb =
      (payload && payload.thumbnail && payload.thumbnail.source) ||
      (payload && payload.originalimage && payload.originalimage.source) ||
      "";
    return typeof thumb === "string" ? thumb : "";
  } catch {
    return "";
  }
}

async function getFlickrImage(scientificName) {
  try {
    const tags = encodeURIComponent(scientificName.trim());
    if (!tags) return "";
    const url =
      "https://www.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=" +
      tags;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return "";
    const payload = await res.json();
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) return "";
    const media = payload.items[0] && payload.items[0].media ? payload.items[0].media.m : "";
    return typeof media === "string" ? media : "";
  } catch {
    return "";
  }
}
