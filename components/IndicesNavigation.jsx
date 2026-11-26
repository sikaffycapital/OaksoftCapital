"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../app/indices/positions/positions.module.css";

export default function IndicesNavigation() {
  const pathname = usePathname();
  const onPositions = pathname === "/indices/positions";

  return (
    <div className={styles.navigationWrap}>
      <nav className={styles.navigation} aria-label="Indices sections">
        <Link
          href="/indices"
          className={`${styles.navLink} ${!onPositions ? styles.navActive : ""}`}
          aria-current={!onPositions ? "page" : undefined}
        >
          Baskets
        </Link>
        <Link
          href="/indices/positions"
          className={`${styles.navLink} ${onPositions ? styles.navActive : ""}`}
          aria-current={onPositions ? "page" : undefined}
        >
          Positions
        </Link>
      </nav>
    </div>
  );
}
