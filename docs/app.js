const PAGE_SIZE = 80;

(async function main() {
  const status = document.getElementById("status");
  const rowsEl = document.getElementById("rows");
  const dataUrl = "https://raw.githubusercontent.com/cpa/oiseauxdepalaiseau/refs/heads/main/birddb.json";

  const imageUrlCache = new Map();
  let allRows = [];
  let renderedCount = 0;
  let isBatchLoading = false;
  let loadAnchor = null;
  const imageObserver = new IntersectionObserver(onImageIntersection, {
    rootMargin: "250px 0px",
    threshold: 0.01,
  });
  const batchObserver = new IntersectionObserver(onBatchIntersection, {
    rootMargin: "1200px 0px",
    threshold: 0.01,
  });

  function formatStatus() {
    if (renderedCount === 0) return "Chargement...";
    if (renderedCount >= allRows.length) {
      return `Les oiseaux de Palaiseau (${allRows.length})`;
    }
    return `${renderedCount} / ${allRows.length} oiseaux affichés`;
  }

  function createAnchor() {
    if (loadAnchor) return;
    loadAnchor = document.createElement("div");
    loadAnchor.id = "lazy-load-anchor";
    rowsEl.insertAdjacentElement("afterend", loadAnchor);
    batchObserver.observe(loadAnchor);
  }

  function stopObservers() {
    if (loadAnchor) {
      batchObserver.unobserve(loadAnchor);
      loadAnchor.remove();
      loadAnchor = null;
    }
  }

  function renderNextBatch() {
    if (isBatchLoading || renderedCount >= allRows.length) return;
    isBatchLoading = true;

    const start = renderedCount;
    const end = Math.min(start + PAGE_SIZE, allRows.length);
    const fragment = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      const row = allRows[i];
      const card = document.createElement("article");
      card.className = "bird-row";

      const media = document.createElement("div");
      media.className = "bird-media";
      const image = document.createElement("img");
      image.className = "bird-image";
      image.alt = row.com_name || row.sci_name || "Oiseau";
      image.loading = "lazy";
      image.decoding = "async";

      const sciKey = (row.sci_name || "").trim();
      if (sciKey) {
        image.dataset.sciName = sciKey;
        imageObserver.observe(image);
      } else {
        image.classList.add("is-missing");
      }
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
        link.className =
          "text-emerald-700 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-900";
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

      fragment.appendChild(card);
    }

    rowsEl.appendChild(fragment);
    renderedCount = end;
    status.textContent = formatStatus();
    isBatchLoading = false;

    if (renderedCount >= allRows.length) {
      stopObservers();
    }
  }

  function onBatchIntersection(entries) {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    renderNextBatch();
  }

  function onImageIntersection(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const image = entry.target;
      imageObserver.unobserve(image);

      const sciName = image.dataset.sciName || "";
      image.onload = () => {
        image.classList.add("is-ready");
        const media = image.parentElement;
        if (media) media.classList.add("has-image");
      };
      image.onerror = () => {
        image.classList.add("is-missing");
      };

      getCachedBirdImageUrl(sciName)
        .then((url) => {
          if (!image.isConnected) return;
          if (url) {
            image.src = url;
          } else {
            image.classList.add("is-missing");
          }
        })
        .catch(() => {
          if (image.isConnected) image.classList.add("is-missing");
        });
    }
  }

  function getCachedBirdImageUrl(scientificName) {
    const name = (scientificName || "").trim();
    if (!name) return Promise.resolve("");

    if (imageUrlCache.has(name)) return imageUrlCache.get(name);

    const promise = (async () => {
      const wikiImage = await getWikipediaFrImage(name);
      return wikiImage || (await getFlickrImage(name));
    })();
    imageUrlCache.set(name, promise);
    return promise;
  }

  try {
    const res = await fetch(dataUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Echec du chargement JSON (" + res.status + ")");
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("Le JSON doit etre un tableau.");
    }

    allRows = data;
    status.textContent = "Chargement initial...";
    createAnchor();
    renderNextBatch();
  } catch (err) {
    status.textContent = "Erreur: " + (err && err.message ? err.message : String(err));
    stopObservers();
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
