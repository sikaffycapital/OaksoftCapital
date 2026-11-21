import styles from "./basket.module.css";

export default function LoadingBasketDetail() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Loading basket">
      <div className={styles.shell}>
        <div className={styles.skeletonNav} />
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonBlock} />
          <div className={styles.skeletonBlock} />
        </div>
      </div>
    </main>
  );
}
