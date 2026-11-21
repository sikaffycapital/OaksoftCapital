// app/payments/wallet/page.jsx
// Worker wallet preview with sample data. Hidden from search engines.

import WorkerWallet from "@/components/payments/WorkerWallet";

export const metadata = {
  title: "Worker wallet (preview) | Oaksoft Payments",
  description: "Preview of the Oaksoft Payments worker wallet with sample data.",
  robots: { index: false, follow: false },
};

export default function WorkerWalletPage() {
  return <WorkerWallet />;
}
