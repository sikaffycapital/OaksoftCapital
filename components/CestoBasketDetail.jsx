"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CestoInvestButton } from "@cesto/react";
import IndicesNavigation from "./IndicesNavigation";
import styles from "../app/indices/[slug]/basket.module.css";

const safeString = (value) => typeof value === "string" ? value : "";
const cleanUrl = (value) => {
  if (typeof value !== "string") return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

function tokenMinimum(version) {
  const raw = version?.minimumInvestment;
  const decimals = Number(version?.inputToken?.decimals);
  if (!/^\d+$/.test(String(raw ?? "")) || !Number.isInteger(decimals) || decimals < 0 || decimals > 30) return null;
  try {
    const atomic = BigInt(raw);
    const scale = 10n ** BigInt(decimals);
    const whole = atomic / scale;
    const fraction = (atomic % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
    const usdCents = (atomic * 100n + scale - 1n) / scale;
    return { raw: String(raw), decimals, usdCents: Number(usdCents), formatted: `${whole}${fraction ? `.${fraction}` : ""}` };
  } catch {
    return null;
  }
}

function InlineMarkdown({ text }) {
  const pieces = safeString(text).split(/(\*\*[^*]+\*\*)/g);
  return pieces.map((piece, index) => piece.startsWith("**") && piece.endsWith("**")
    ? <strong key={index}>{piece.slice(2, -2)}</strong>
    : <span key={index}>{piece}</span>);
}

function MarkdownText({ value }) {
  const lines = safeString(value).split(/\r?\n/);
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      blocks.push(<ul key={`list-${blocks.length}`}>{list.map((line, index) => <li key={index}><InlineMarkdown text={line} /></li>)}</ul>);
      list = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) { flush(); return; }
    if (/^[-*]\s+/.test(trimmed)) { list.push(trimmed.replace(/^[-*]\s+/, "")); return; }
    flush();
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) blocks.push(<h3 key={`heading-${blocks.length}`}><InlineMarkdown text={heading[2]} /></h3>);
    else blocks.push(<p key={`paragraph-${blocks.length}`}><InlineMarkdown text={trimmed} /></p>);
  });
  flush();
  return blocks.length ? <div className={styles.markdown}>{blocks}</div> : <div className={styles.emptyDetail}>No source notes have been provided for this basket.</div>;
}

function Metric({ label, value }) {
  const number = typeof value === "number" ? value : Number(value);
  const valid = value !== null && value !== undefined && value !== "" && Number.isFinite(number);
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      {valid
        ? <span className={`${styles.metricValue} ${number < 0 ? styles.metricNegative : ""}`}>{number > 0 ? "+" : ""}{number.toFixed(2)}%</span>
        : <span className={`${styles.metricValue} ${styles.metricUnavailable}`}>Not available</span>}
    </div>
  );
}

export default function CestoBasketDetail({ product, live, publishableConfigured }) {
  const version = product?.version || null;
  const legs = Array.isArray(version?.legs) ? version.legs : [];
  const inputToken = version?.inputToken || {};
  const minimum = useMemo(() => tokenMinimum(version), [version]);
  const isUsdc = safeString(inputToken.symbol).toUpperCase() === "USDC";
  const formattedMinUsd = isUsdc && minimum && Number.isFinite(minimum.usdCents)
    ? Math.max(0.01, minimum.usdCents / 100)
    : null;
  const initialAmount = formattedMinUsd !== null && formattedMinUsd <= 1e9 ? formattedMinUsd.toFixed(2) : "100.00";
  const [amount, setAmount] = useState(initialAmount);
  const [step, setStep] = useState("amount");
  const [acknowledged, setAcknowledged] = useState(false);
  const [sdkError, setSdkError] = useState("");
  const [successEvent, setSuccessEvent] = useState(null);
  const [scheduledEvent, setScheduledEvent] = useState(null);
  const amountNumber = Number(amount);
  const amountSyntaxValid = /^\d+(?:\.\d{1,2})?$/.test(amount);
  const belowMin = isUsdc && minimum && amountSyntaxValid && Number.isFinite(amountNumber) && (() => {
    try {
      const [whole, fraction = ""] = amount.split(".");
      const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
      return cents * (10n ** BigInt(minimum.decimals)) < BigInt(minimum.raw) * 100n;
    } catch {
      return false;
    }
  })();
  const amountValid = amountSyntaxValid && Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber <= 1e9 && !belowMin;
  const canExecute = live === true
    && product?.isActive === true
    && product?.trading?.state === "open"
    && product?.geoStatus?.canInvest === true
    && Boolean(version)
    && Boolean(publishableConfigured);
  const allocationTotal = useMemo(() => legs.reduce((sum, leg) => sum + (Number(leg.weightBps) || 0), 0), [legs]);

  const validationMessage = amount === ""
    ? "Enter an amount to continue."
    : !amountSyntaxValid
      ? "Use a positive dollar amount with no more than two decimal places."
      : !Number.isFinite(amountNumber) || amountNumber <= 0 || amountNumber > 1e9
        ? "Amount must be greater than $0 and no more than $1,000,000,000."
        : belowMin
          ? formattedMinUsd !== null
            ? `The minimum is $${formattedMinUsd.toFixed(2)}.`
            : "The published minimum exceeds the supported amount."
          : "";

  const statusMessage = !publishableConfigured
    ? "Investment setup is unavailable: the public Cesto investment key is not configured. It is separate from the secret key used for positions."
    : live !== true
      ? "This basket is not currently available for live investment."
      : product?.isActive !== true
        ? "This basket is inactive and cannot accept an investment."
        : product?.trading?.state !== "open"
          ? "Trading for this basket is not open."
          : product?.geoStatus?.canInvest !== true
            ? "Investment is unavailable in your region."
            : !version
              ? "A published basket version is not available for investment."
              : "";

  const review = () => {
    if (!amountValid) return;
    setSdkError("");
    setStep("review");
  };
  const safeSdkError = (event) => {
    const code = typeof event?.code === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(event.code) ? ` (${event.code})` : "";
    setSdkError(`Cesto could not start this investment${code}. No success is recorded unless Cesto confirms it.`);
  };
  const resources = Array.isArray(version?.resources) ? version.resources : [];
  const changelog = version?.changelog;
  const about = version?.about;
  const riskNotes = version?.riskNotes;
  const art = cleanUrl(product?.logoUrl);
  const categories = Array.isArray(product?.categories) ? product.categories : [];
  const metrics = product?.performance;
  const investmentReadyLabel = statusMessage ? "Investment unavailable" : "Continue with Cesto";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <IndicesNavigation />
        <Link className={styles.crumb} href="/indices"><span aria-hidden="true">←</span> ALL BASKETS <span>/</span> {safeString(product?.name).toUpperCase()}</Link>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>OAKSOFT CAPITAL MANAGEMENT / THEMATIC BASKET</span>
            <h1 className={styles.title}>{product?.name || "Basket details"}</h1>
            <p className={styles.description}>{product?.description || "Explore the basket’s published construction and source notes."}</p>
            <div className={styles.heroMeta}>
              {categories.map((category) => <span className={styles.tag} key={category}>{category}</span>)}
              {product?.creatorName ? <span className={styles.tag}>Curated by {product.creatorName}</span> : null}
              {product?.pointsMultiplier > 1 ? <span className={styles.tag}>{product.pointsMultiplier}× points</span> : null}
            </div>
          </div>
          <div className={styles.artPanel}>
            {art ? <img className={styles.art} src={art} alt="" /> : null}
            <div className={styles.artVeil} />
            <span className={styles.artStamp}>BASKET / {version?.number ? `V${version.number}` : "DETAIL"}</span>
          </div>
        </header>

        <div className={`${styles.statusStrip} ${!canExecute ? styles.statusClosed : ""}`}>
          <div className={styles.statusLeft}><span className={styles.statusDot} />{canExecute ? "Published basket · investment currently open" : statusMessage || "Browse published basket details"}</div>
          <span className={styles.statusRight}>{version?.publishedAt && Number.isFinite(Date.parse(version.publishedAt)) ? `PUBLISHED ${new Date(version.publishedAt).toISOString().slice(0, 10)}` : "PUBLISH DATE NOT AVAILABLE"}</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.mainColumn}>
            <nav className={styles.anchorNav} aria-label="Basket details">
              <a className={styles.anchorLink} href="#allocation">Allocation</a>
              <a className={styles.anchorLink} href="#strategy">Strategy</a>
              <a className={styles.anchorLink} href="#risks">Risks</a>
              <a className={styles.anchorLink} href="#performance">Performance</a>
              <a className={styles.anchorLink} href="#resources">Resources</a>
            </nav>

            <section className={styles.section} id="allocation">
              <div className={styles.sectionHeading}><h2>What’s inside</h2><span className={styles.sectionIndex}>{legs.length ? `${legs.length} ASSETS` : "ALLOCATION"}</span></div>
              <p className={styles.sectionIntro}>Published target weights. These describe basket composition, not a live execution quote.</p>
              {legs.length ? (
                <div className={styles.allocationList}>
                  {legs.map((leg, index) => {
                    const token = leg.token || {};
                    const logo = cleanUrl(token.logoUrl);
                    const weight = Number(leg.weightBps);
                    return (
                      <div className={styles.allocationRow} key={leg.legKey || `${token.symbol || "asset"}-${index}`}>
                        <div className={styles.assetCell}>
                          {logo ? <img className={styles.tokenLogo} src={logo} alt="" /> : <span className={styles.tokenFallback}>{safeString(token.symbol).slice(0, 3) || "—"}</span>}
                          <span className={styles.assetName}>{token.name || token.symbol || "Asset"}<span className={styles.assetSymbol}>{token.symbol || "Symbol unavailable"}{token.category ? ` · ${token.category}` : ""}</span></span>
                        </div>
                        <span className={styles.kind}>{leg.kind || "Basket asset"}</span>
                        <span className={styles.weight}>{Number.isFinite(weight) ? `${(weight / 100).toFixed(2)}%` : "—"}</span>
                      </div>
                    );
                  })}
                  {allocationTotal !== 10000 ? <p className={styles.sectionIntro}>Published allocation totals {(allocationTotal / 100).toFixed(2)}%; displayed weights are shown as supplied.</p> : null}
                </div>
              ) : <div className={styles.emptyDetail}>A published allocation is not available for this basket yet.</div>}
            </section>

            <section className={styles.section} id="strategy">
              <div className={styles.sectionHeading}><h2>Source strategy</h2><span className={styles.sectionIndex}>01 / THESIS</span></div>
              <MarkdownText value={about} />
            </section>

            <section className={styles.section} id="risks">
              <div className={styles.sectionHeading}><h2>Risks to consider</h2><span className={styles.sectionIndex}>02 / RISK</span></div>
              <MarkdownText value={riskNotes} />
            </section>

            <section className={styles.section} id="performance">
              <div className={styles.sectionHeading}><h2>Performance</h2><span className={styles.sectionIndex}>HISTORICAL</span></div>
              <p className={styles.sectionIntro}>Historical performance is not a prediction of future results.</p>
              {metrics ? (
                <div className={styles.performanceGrid}>
                  <Metric label="7 days" value={metrics.return7d} />
                  <Metric label="30 days" value={metrics.return30d} />
                  <Metric label="All time" value={metrics.returnAll} />
                  <Metric label="24-hour change" value={metrics.change24h} />
                </div>
              ) : <div className={styles.emptyDetail}>Performance data has not been provided for this basket.</div>}
            </section>

            <section className={styles.section} id="resources">
              <div className={styles.sectionHeading}><h2>Resources & updates</h2><span className={styles.sectionIndex}>03 / SOURCES</span></div>
              {typeof version?.resources === "string" && version.resources.trim() ? <MarkdownText value={version.resources} /> : resources.length ? (
                <div className={styles.resources}>
                  {resources.map((resource, index) => {
                    const url = cleanUrl(typeof resource === "string" ? resource : resource?.url);
                    if (!url) return null;
                    const label = typeof resource === "string" ? resource : resource?.title || resource?.name || url;
                    return <a className={styles.resourceLink} key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer"><span>{label}</span><span className={styles.resourceType}>{resource?.type || "Open source"} ↗</span></a>;
                  })}
                </div>
              ) : <div className={styles.emptyDetail}>No external resources have been published.</div>}
              {changelog ? <div style={{ marginTop: 20 }}><div className={styles.sectionHeading}><h2>Version notes</h2><span className={styles.sectionIndex}>{version?.number ? `V${version.number}` : ""}</span></div><MarkdownText value={typeof changelog === "string" ? changelog : JSON.stringify(changelog)} /></div> : null}
            </section>
          </div>

          <aside className={styles.sidePanel} aria-label="Investment amount and review">
            <div className={styles.panelHead}>
              <span className={styles.panelEyebrow}>{step === "review" ? "STEP 02 / REVIEW" : "STEP 01 / AMOUNT"}</span>
              <h2 className={styles.panelTitle}>{step === "review" ? "Review your amount" : "Choose an amount"}</h2>
            </div>
            <div className={styles.panelBody}>
              {step === "amount" ? (
                <>
                  <label className={styles.amountLabel} htmlFor="basket-amount">Investment amount (USD)</label>
                  <div className={styles.amountBox}><span className={styles.currency}>$</span><input id="basket-amount" className={styles.amountInput} type="text" inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" aria-describedby="amount-help amount-validation" /></div>
                  <p className={styles.helpText} id="amount-help">
                    {minimum && inputToken.symbol ? isUsdc
                      ? formattedMinUsd !== null
                        ? `Published minimum: $${formattedMinUsd.toFixed(2)} USD (USDC input).`
                        : "Published USDC minimum exceeds the supported amount."
                      : `Published minimum: ${minimum.formatted} ${inputToken.symbol}. A USD equivalent is not available here.`
                      : "Minimum investment information is not available."}
                  </p>
                  <p className={styles.validation} id="amount-validation" aria-live="polite">{validationMessage}</p>
                  <div className={styles.panelRule} />
                  <button type="button" className={styles.primaryButton} onClick={review} disabled={!amountValid}>Review basket <span aria-hidden="true">→</span></button>
                  {statusMessage ? <p className={styles.notice} role="status">{!publishableConfigured ? <><strong>Key required.</strong> The public Cesto investment key is missing. This is different from the secret positions key.</> : statusMessage}</p> : null}
                  <p className={styles.smallPrint}>No wallet connection or transaction is initiated until you continue with Cesto.</p>
                </>
              ) : (
                <>
                  <div className={styles.reviewSummary}><span>Investment amount</span><strong>${amountNumber.toFixed(2)} USD</strong></div>
                  <div className={styles.panelRule} />
                  <p className={styles.helpText}>Indicative allocation using published target weights</p>
                  <div className={styles.reviewAllocations}>
                    {legs.map((leg, index) => {
                      const weight = Number(leg.weightBps);
                      const allocated = Number.isFinite(weight) ? amountNumber * weight / 10000 : null;
                      return <div className={styles.reviewLine} key={leg.legKey || index}><span>{leg.token?.symbol || leg.token?.name || "Asset"} · {Number.isFinite(weight) ? `${(weight / 100).toFixed(2)}%` : "weight unavailable"}</span><strong>{allocated === null ? "—" : `$${allocated.toFixed(2)}`}</strong></div>;
                    })}
                  </div>
                  <p className={styles.indicative}>Indicative USD allocations only, not a live execution preview or token quantity. Values are derived from the published weights.</p>
                  <label className={styles.acknowledge}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I have reviewed the source strategy and risks, and understand that basket investments can lose value.</span></label>
                  {canExecute ? (
                    <>
                      <CestoInvestButton
                        basket={product.slug}
                        amountUsd={amountNumber}
                        unstyled
                        className={styles.primaryButton}
                        disabled={!acknowledged || !amountValid}
                        onError={safeSdkError}
                        onSuccess={(event) => { setSdkError(""); setSuccessEvent(event || {}); }}
                        onScheduled={(event) => { setSdkError(""); setScheduledEvent(event || {}); }}
                      >
                        {investmentReadyLabel} <span aria-hidden="true">↗</span>
                      </CestoInvestButton>
                    </>
                  ) : (
                    <button type="button" className={styles.primaryButton} disabled title={statusMessage}>{investmentReadyLabel}</button>
                  )}
                  <button type="button" className={styles.secondaryButton} onClick={() => { setStep("amount"); setAcknowledged(false); }}>Back / edit</button>
                  {statusMessage ? <p className={styles.notice} role="status">{!publishableConfigured ? <><strong>Key required.</strong> The public Cesto investment key is missing. It differs from the secret key used for positions.</> : statusMessage}</p> : null}
                  {sdkError ? <p className={styles.notice} role="alert">{sdkError}</p> : null}
                  {successEvent ? <div className={styles.eventNotice} role="status">Cesto confirmed an investment event{successEvent.status ? `: ${String(successEvent.status)}` : "."}<br /><Link className={styles.positionsLink} href="/indices/positions">View Positions</Link></div> : null}
                  {scheduledEvent ? <p className={styles.eventNotice} role="status">Cesto reported a scheduled investment{scheduledEvent.scheduledFor ? ` for ${String(scheduledEvent.scheduledFor)}` : "."} No completion is inferred.</p> : null}
                  <p className={styles.smallPrint}>Cesto handles the investment flow. Oaksoft does not custody your assets.</p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
