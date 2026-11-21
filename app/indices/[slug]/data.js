import catalogue from "../catalogue.json";

const API = "https://api.cesto.co/v1/products";
const validSlug = (slug) =>
  typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;

// Public product information only. Investment authorisation remains in Cesto's SDK.
export async function loadBasketDetail(slug, fetcher, savedCatalogue = catalogue) {
  if (!validSlug(slug)) return null;

  try {
    const response = await fetcher(`${API}/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    // A removed/restricted product must not reappear from the saved catalogue.
    if ([403, 404, 410].includes(response.status)) return null;
    if (!response.ok) throw new Error(`Product returned HTTP ${response.status}`);
    const product = await response.json();
    if (!product || typeof product.slug !== "string" || typeof product.name !== "string") {
      throw new Error("Invalid product response");
    }
    if (product.geoStatus?.canView === false || product.isPublished === false || product.isLabsProduct) {
      return null;
    }
    return {
      live: true,
      product: {
        slug: product.slug,
        name: product.name,
        description: product.description || "",
        logoUrl: product.logoUrl || null,
        categories: Array.isArray(product.categories) ? product.categories : [],
        creatorName: product.creatorName || "Cesto",
        isActive: product.isActive === true,
        liveStatus: product.liveStatus || null,
        trading: product.trading || null,
        geoStatus: product.geoStatus || null,
        pointsMultiplier: product.pointsMultiplier || 1,
        version: product.version || null,
        performance: product.performance || null,
      },
    };
  } catch (error) {
    console.error("[Cesto] public basket detail unavailable:", error?.message);
    const saved = savedCatalogue.find((item) => item.slug === slug);
    if (!saved) return null;
    // Never substitute cached returns, weights or trading eligibility.
    return {
      live: false,
      product: {
        slug: saved.slug,
        name: saved.name,
        description: saved.description,
        logoUrl: saved.image,
        categories: saved.categories || [],
        creatorName: "Cesto",
        isActive: false,
        trading: null,
        geoStatus: null,
        version: null,
        performance: null,
      },
    };
  }
}

export async function getBasketDetail(slug) {
  return loadBasketDetail(slug, fetch);
}
