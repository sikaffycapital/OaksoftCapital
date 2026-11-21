import IndicesGrid from "../../components/IndicesGrid";
import IndicesNavigation from "../../components/IndicesNavigation";
import styles from "./indices.module.css";
import { getIndices } from "../../lib/cestoIndices";

export default async function Indices() {
  const { live, items } = await getIndices();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowRule} />
          OAKSOFT CAPITAL MANAGEMENT
          <span className={styles.eyebrowDivider} />
          INVESTMENT THEMES
        </div>
        <header className={styles.heading}>
          <div>
            <h1 className={styles.title}>Explore the indices</h1>
            <p className={styles.intro}>
              A considered collection of blockchain investment themes. Explore a basket, then invest directly to your wallet.
            </p>
          </div>
          <div className={styles.assurance}>
            <span className={styles.assuranceDot} />
            Non-custodial investing
          </div>
        </header>

        <IndicesNavigation />

        {!live && (
          <aside className={styles.previewNotice} aria-label="Saved catalogue">
            <span className={styles.previewMark}>i</span>
            <span><strong>Saved catalogue</strong> — showing Cesto baskets while live data is unavailable. Performance is not displayed.</span>
          </aside>
        )}

        <section className={styles.browse} aria-label="Investment baskets">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionKicker}>THE COLLECTION</span>
              <h2>Investment baskets</h2>
            </div>
            <span className={styles.collectionCount}>{items.length} {items.length === 1 ? "basket" : "baskets"}</span>
          </div>
          <IndicesGrid items={items} />
        </section>
      </div>
    </div>
  );
}
