import IndicesGrid from "../../../components/IndicesGrid";
import CestoPositions from "../../../components/CestoPositions";
import styles from "../indices.module.css";
import positionStyles from "./positions.module.css";
import { getIndices } from "../../../lib/cestoIndices";

export default async function PositionsPage() {
  const { items } = await getIndices();
  const recommendations = items.slice(0, 3);
  const configured = Boolean(process.env.CESTO_SECRET_KEY && process.env.SESSION_SECRET);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowRule} />
          OAKSOFT CAPITAL MANAGEMENT
          <span className={styles.eyebrowDivider} />
          INVESTMENT THEMES
        </div>
        <CestoPositions configured={configured} />
        <section className={positionStyles.recommendations} aria-labelledby="recommended-baskets-title">
          <div className={positionStyles.recommendationHeading}>
            <span className={positionStyles.kicker}>THE COLLECTION</span>
            <h2 id="recommended-baskets-title">Explore Cesto baskets</h2>
          </div>
          <IndicesGrid items={recommendations} />
        </section>
      </div>
    </div>
  );
}
