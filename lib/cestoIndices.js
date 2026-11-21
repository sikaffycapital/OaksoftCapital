// Public, read-only catalogue used by Cesto's own basket browser.
// Investment authorisation still belongs to the client-side Cesto SDK.
import catalogue from "../app/indices/catalogue.json";

const CATALOGUE_URL = "https://api.cesto.co/v1/products";

function pickPerformance(performance) {
  if (Number.isFinite(performance?.return7d)) {
    return { label: "1 Week Return", value: performance.return7d };
  }
  if (Number.isFinite(performance?.return30d)) {
    return { label: "1 Month Return", value: performance.return30d };
  }
  return null;
}

function toCard(product) {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    image: product.logoUrl || null,
    categories: Array.isArray(product.categories) ? product.categories : [],
    points: product.pointsMultiplier > 1 ? `${product.pointsMultiplier}x Pts` : null,
    performance: pickPerformance(product.performance),
  };
}

export async function getIndices() {
  try {
    const products = [];
    const seenCursors = new Set();
    let cursor = null;

    do {
      const url = new URL(CATALOGUE_URL);
      url.searchParams.set("limit", "100");
      if (cursor) url.searchParams.set("cursor", cursor);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Catalogue returned HTTP ${response.status}`);
      const page = await response.json();
      if (!Array.isArray(page.items)) throw new Error("Invalid catalogue response");
      products.push(...page.items);
      cursor = page.nextCursor || null;
      if (cursor && seenCursors.has(cursor)) throw new Error("Repeated catalogue cursor");
      if (cursor) seenCursors.add(cursor);
      if (seenCursors.size >= 100) throw new Error("Catalogue pagination limit exceeded");
    } while (cursor);

    const slugs = new Set();
    const items = products
      .filter((product) => {
        if (!product.isActive || product.isLabsProduct || product.geoStatus?.canView === false) return false;
        if (!product.slug || !product.name || slugs.has(product.slug)) return false;
        slugs.add(product.slug);
        return true;
      })
      .map(toCard);
    return { live: true, items };
  } catch (err) {
    console.error("[Cesto] public catalogue unavailable:", err?.message);
    // Never freeze old investment returns into the saved catalogue.
    return { live: false, items: catalogue };
  }
}
