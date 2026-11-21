"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "../app/indices/indices.module.css";

const ART_BY_CATEGORY = {
  ai: "/assets/indices/ai.webp",
  hedges: "/assets/indices/hedges.webp",
  hedge: "/assets/indices/hedges.webp",
  crypto: "/assets/indices/crypto.webp",
  yield: "/assets/indices/yield.webp",
  politics: "/assets/indices/trackers.webp",
  trackers: "/assets/indices/trackers.webp",
  tracker: "/assets/indices/trackers.webp",
  trending: "/assets/indices/trending.webp",
};

const titleCase = (value) =>
  value.length <= 2 ? value.toUpperCase() : value.charAt(0).toUpperCase() + value.slice(1);

const fallbackArt = (item) => {
  const values = [...(item.categories || []), item.slug, item.name]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  for (const value of values) {
    const match = Object.keys(ART_BY_CATEGORY).find((category) => value.includes(category));
    if (match) return ART_BY_CATEGORY[match];
  }
  return "/assets/indices/trending.webp";
};

const formatPct = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export default function IndicesGrid({ items = [] }) {
  const categories = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.categories || []))).sort((a, b) => a.localeCompare(b)),
    [items]
  );
  const [active, setActive] = useState("all");
  const shown = active === "all"
    ? items
    : items.filter((item) => (item.categories || []).includes(active));

  return (
    <>
      <div className={styles.filters} aria-label="Filter baskets by category">
        <div className={styles.filterList}>
          {["all", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`${styles.filterButton} ${active === category ? styles.filterActive : ""}`}
              aria-pressed={active === category}
            >
              {category === "all" ? "All themes" : titleCase(category)}
            </button>
          ))}
        </div>
        <span className={styles.filterCount}>
          {shown.length} {shown.length === 1 ? "basket" : "baskets"}
        </span>
      </div>

      {shown.length ? (
        <div className={styles.grid}>
          {shown.map((item, index) => (
            <IndexCard key={item.slug} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyMark}>—</span>
          <h3>No baskets in this theme</h3>
          <p>Choose another category to continue exploring.</p>
          <button type="button" className={styles.resetButton} onClick={() => setActive("all")}>
            View all themes
          </button>
        </div>
      )}
    </>
  );
}

function IndexCard({ item, index }) {
  const performance = item.performance;
  const categories = item.categories || [];
  const art = item.image || fallbackArt(item);
  const detailHref = `/indices/${encodeURIComponent(item.slug)}`;

  return (
    <article className={styles.card} style={{ "--card-order": index }}>
      <Link href={detailHref} className={styles.artFrame} aria-label={`Explore ${item.name}`}>
        <img
          className={styles.art}
          src={art}
          alt=""
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className={styles.artShade} />
        <div className={styles.artMeta}>
          <span className={styles.themeLabel}>CURATED THEME</span>
          {item.points ? <span className={styles.points}>{item.points}</span> : null}
        </div>
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <h3><Link href={detailHref}>{item.name}</Link></h3>
          <span className={styles.cardIndex}>/{String(index + 1).padStart(2, "0")}</span>
        </div>
        <Link href={detailHref} className={styles.description}>{item.description}</Link>

        <div className={styles.cardDetails}>
          <div className={styles.categoryList}>
            {categories.slice(0, 2).map((category) => (
              <span className={styles.categoryTag} key={category}>{titleCase(category)}</span>
            ))}
          </div>
          <div className={styles.performance}>
            <span className={styles.performanceLabel}>
              {performance?.label || "Performance"}
            </span>
            {performance ? (
              <span className={`${styles.performanceValue} ${performance.value < 0 ? styles.performanceNegative : ""}`}>
                {formatPct(performance.value)}
              </span>
            ) : (
              <span className={styles.performanceUnavailable}>Not available</span>
            )}
          </div>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.ticketNote}>Understand the basket before investing</span>
          <Link href={detailHref} className={styles.investButton}>
            Explore basket
            <span aria-hidden="true" className={styles.buttonArrow}>↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
