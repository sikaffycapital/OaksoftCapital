"use client";

import { CestoProvider } from "@cesto/react";

export default function IndicesLayout({ children }) {
  return (
    <CestoProvider
      apiKey={process.env.NEXT_PUBLIC_CESTO_PK}
      theme={{ accent: "#95E100", background: "#0a0a0a", radius: "12px", scheme: "dark" }}
    >
      {children}
    </CestoProvider>
  );
}
