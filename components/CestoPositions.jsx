"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { createPositionsChallenge, readPositions } from "../app/indices/positions/actions";
import IndicesNavigation from "./IndicesNavigation";
import styles from "../app/indices/positions/positions.module.css";

const money = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
};

const dateTime = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const compactAddress = (address) => address ? `${address.slice(0, 6)}…${address.slice(-5)}` : "";

function formatAmount(amount, decimals) {
  if (amount === null || amount === undefined || amount === "" ||
      !Number.isInteger(decimals) || decimals < 0 || decimals > 40) return "—";
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "—";
  const adjusted = numeric / (10 ** decimals);
  if (adjusted > 0 && adjusted < 0.00001) return "<0.00001";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 5 }).format(adjusted);
}

export default function CestoPositions({ configured }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: "solana" });
  const activeAddress = isConnected ? address : undefined;
  const { walletProvider } = useAppKitProvider("solana");
  const [view, setView] = useState("positions");
  const [proof, setProof] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const lastAddress = useRef(activeAddress);

  useLayoutEffect(() => {
    if (lastAddress.current !== activeAddress) {
      lastAddress.current = activeAddress;
      requestId.current += 1;
      setProof(null);
      setSnapshot(null);
      setError("");
      setBusy(false);
      setView("positions");
    }
  }, [activeAddress]);

  useEffect(() => {
    if (!proof?.expiresAt) return undefined;
    const remaining = new Date(proof.expiresAt).getTime() - Date.now();
    const timeout = window.setTimeout(() => {
      requestId.current += 1;
      setProof(null);
      setSnapshot(null);
      setError("Wallet verification expired. Verify again to view current positions.");
      setBusy(false);
    }, Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
  }, [proof?.expiresAt]);

  const runRead = async (wallet, id) => {
    const provider = walletProvider;
    if (!provider || typeof provider.signMessage !== "function") {
      setError("This connected wallet does not support message signing. Choose a Solana wallet that supports signMessage.");
      setBusy(false);
      return;
    }

    try {
      setError("");
      const challenge = await createPositionsChallenge(wallet);
      if (requestId.current !== id || lastAddress.current !== wallet) return;
      if (!challenge?.ok) {
        setError(challenge?.message || "Could not prepare wallet verification. Please try again.");
        setBusy(false);
        return;
      }

      const bytes = new TextEncoder().encode(challenge.message);
      const signature = await provider.signMessage(bytes);
      if (requestId.current !== id || lastAddress.current !== wallet) return;
      if (!(signature instanceof Uint8Array) || signature.length !== 64) {
        setError("The wallet returned an unsupported signature. Please reconnect and try again.");
        setBusy(false);
        return;
      }

      const response = await readPositions({ token: challenge.token, signature: Array.from(signature) });
      if (requestId.current !== id || lastAddress.current !== wallet) return;
      if (!response?.ok) {
        setProof(null);
        setSnapshot(null);
        setError(response?.message || "Positions could not be read. Please verify again.");
        setBusy(false);
        return;
      }

      setProof({ token: challenge.token, signature: Array.from(signature), expiresAt: challenge.expiresAt, wallet });
      setSnapshot(response);
      setError("");
      setBusy(false);
    } catch (cause) {
      if (requestId.current !== id || lastAddress.current !== wallet) return;
      const message = String(cause?.message || "").toLowerCase();
      setError(message.includes("reject") || message.includes("cancel")
        ? "Wallet verification was cancelled. No positions were requested."
        : "Wallet verification failed. Check your wallet connection and try again.");
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!isConnected || !address) {
      open({ view: "Connect", namespace: "solana" });
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setProof(null);
    setSnapshot(null);
    await runRead(address, id);
  };

  const refresh = async () => {
    if (!proof || !snapshot || !address || proof.wallet !== address) return;
    const expiry = new Date(proof.expiresAt).getTime();
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      setProof(null);
      setSnapshot(null);
      setError("Wallet verification expired. Verify again to view current positions.");
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const response = await readPositions({ token: proof.token, signature: proof.signature });
      if (requestId.current !== id || lastAddress.current !== address) return;
      if (!response?.ok) {
        setProof(null);
        setSnapshot(null);
        setError(response?.message || "Positions could not be refreshed. Please verify again.");
        setBusy(false);
        return;
      }
      setSnapshot(response);
      setBusy(false);
    } catch {
      if (requestId.current !== id) return;
      setError("Positions could not be refreshed. Please verify again.");
      setBusy(false);
    }
  };

  const activeProof = proof && new Date(proof.expiresAt).getTime() > Date.now();
  const positions = snapshot?.positions || [];
  const activity = snapshot?.activity || [];

  return (
    <>
      <IndicesNavigation />
      <section className={styles.content} aria-labelledby="positions-title">
        <div className={styles.introRow}>
          <div>
            <span className={styles.kicker}>YOUR OAKSOFT VIEW</span>
            <h1 className={styles.heading} id="positions-title">Positions</h1>
            <p className={styles.description}>
              Connect the same Solana wallet used for your Cesto investments to view positions and available activity. This connection is for viewing only.
            </p>
          </div>
          {!isConnected ? (
            <button className={styles.walletButton} type="button" onClick={() => open({ view: "Connect", namespace: "solana" })}>
              Connect Solana wallet
            </button>
          ) : null}
        </div>

        {!configured ? (
          <div className={styles.notice} role="status">
            <strong>Position tracking isn’t connected yet.</strong> The site owner needs to configure a read-only Cesto connection. Explore baskets remains available while position data is being set up.
          </div>
        ) : null}

        {isConnected && address ? (
          <div className={styles.statusBar}>
            <span>Connected wallet <strong className={styles.walletAddress}>{compactAddress(address)}</strong></span>
            <span>{activeProof ? `Verified until ${dateTime(proof.expiresAt)}` : "Verification required to read positions"}</span>
          </div>
        ) : null}

        <div className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h3>Private, read-only access</h3>
              <p>Verify your wallet to request its current Cesto positions and available activity.</p>
            </div>
          </div>
          <div className={styles.securityNote}>
            <strong>What the signature means:</strong> it proves wallet ownership for this read request only. It does not authorize a transaction, transfer, or change to your holdings. Oaksoft keeps the proof in memory and it expires after five minutes.
          </div>
          {error ? <div className={styles.error} role="alert">{error}</div> : null}
          <div className={styles.controlRow}>
            <button
              className={styles.actionButton}
              type="button"
              onClick={verify}
              disabled={busy || !configured}
            >
              {busy ? "Reading positions…" : "Verify & view positions"}
            </button>
            {snapshot && activeProof ? (
              <button className={styles.secondaryButton} type="button" onClick={refresh} disabled={busy}>
                Refresh
              </button>
            ) : null}
          </div>
        </div>

        {busy && !snapshot ? (
          <div className={styles.skeleton} aria-label="Loading positions" aria-busy="true">
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        ) : null}

        {snapshot && isConnected && snapshot.wallet === address ? (
          <>
            {snapshot.warnings?.length ? (
              <div className={styles.notice} role="status">
                {snapshot.warnings.map((warning, index) => <div key={`${index}-${warning}`}>{warning}</div>)}
              </div>
            ) : null}
            <div className={styles.views} role="group" aria-label="Choose positions or activity">
              <button type="button" className={`${styles.viewTab} ${view === "positions" ? styles.viewActive : ""}`} aria-pressed={view === "positions"} onClick={() => setView("positions")}>Positions</button>
              <button type="button" className={`${styles.viewTab} ${view === "activity" ? styles.viewActive : ""}`} aria-pressed={view === "activity"} onClick={() => setView("activity")}>History</button>
            </div>

            {view === "positions" ? (
              <>
                <div className={styles.summaryLine}>
                  <h3>Your Cesto positions</h3>
                  {snapshot.updatedAt ? <span className={styles.updated}>Updated {dateTime(snapshot.updatedAt)}</span> : null}
                </div>
                {positions.length ? (
                  <div className={styles.positionList}>
                    {positions.map((position) => (
                      <article className={styles.position} key={position.id}>
                        <div className={styles.positionTop}>
                          <div className={styles.positionIdentity}>
                            {position.image ? <img className={styles.positionImage} src={position.image} alt="" loading="lazy" /> : <span className={styles.positionMark} aria-hidden="true">C</span>}
                            <div>
                              <h4 className={styles.positionName}>{position.name}</h4>
                              <div className={styles.positionMeta}>
                                {position.source ? <span>{position.source}</span> : null}
                                {position.slug ? <span>{position.slug}</span> : null}
                              </div>
                            </div>
                          </div>
                          {position.status ? <span className={styles.statusPill}>{position.status}</span> : null}
                        </div>
                        <div className={styles.valueGrid}>
                          <div className={styles.valueCell}><span>Current value</span><strong>{money(position.valueUsd)}</strong></div>
                          <div className={styles.valueCell}><span>Invested</span><strong>{money(position.investedUsd)}</strong></div>
                          <div className={styles.valueCell}><span>Unrealized P&amp;L</span><strong className={typeof position.pnlUsd === "number" ? (position.pnlUsd < 0 ? styles.loss : styles.gain) : ""}>{money(position.pnlUsd)}</strong></div>
                        </div>
                        {position.holdings?.length ? (
                          <div className={styles.holdings} aria-label="Underlying holdings">
                            {position.holdings.map((holding, index) => (
                              <span className={styles.holding} key={`${holding.symbol}-${index}`}>
                                <strong>{holding.symbol}</strong>
                                {formatAmount(holding.amount, holding.decimals)}
                                {typeof holding.valueUsd === "number" ? <span>· {money(holding.valueUsd)}</span> : null}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    {snapshot.warnings?.length ? (
                      <>
                        <h3>Position data is incomplete</h3>
                        <p>One or more position sources could not be read, so Oaksoft can’t confirm whether this wallet has open positions yet. Try again shortly.</p>
                        {activeProof ? <button className={styles.secondaryButton} type="button" onClick={refresh} disabled={busy}>Retry position read</button> : null}
                      </>
                    ) : (
                      <>
                        <h3>No open Cesto positions</h3>
                        <p>This successful read found no positions for the connected wallet. Available baskets remain open to explore.</p>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.summaryLine}>
                  <h3>Available activity</h3>
                  {snapshot.updatedAt ? <span className={styles.updated}>Updated {dateTime(snapshot.updatedAt)}</span> : null}
                </div>
                <p className={styles.description}>This is the activity supplied with this positions read; it may not represent your complete wallet history.</p>
                {activity.length ? (
                  <div className={styles.activityList}>
                    {activity.map((entry) => (
                      <article className={styles.activity} key={entry.id}>
                        <div>
                          <div className={styles.activityName}>{entry.name}</div>
                          <div className={styles.activityMeta}>{entry.type}{entry.status ? ` · ${entry.status}` : ""}</div>
                        </div>
                        <time className={styles.activityDate} dateTime={entry.at}>{dateTime(entry.at)}</time>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <h3>No activity was returned</h3>
                    <p>The current read contains no available activity. This is not a complete wallet history.</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
      </section>
    </>
  );
}
