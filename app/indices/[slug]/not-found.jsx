import Link from "next/link";
import styles from "./basket.module.css";

export default function BasketNotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.notFound}>
        <span className={styles.kicker}>OAKSOFT / BASKETS</span>
        <p className={styles.notFoundMark}>404</p>
        <h1>This basket isn’t here.</h1>
        <p>It may have moved, or it may no longer be part of the collection.</p>
        <Link href="/indices" className={styles.primaryLink}>Return to baskets <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
