// app/payments/dashboard/page.jsx
// Employer dashboard preview with sample data. Hidden from search engines.

import PaymentsDashboard from "@/components/payments/PaymentsDashboard";

export const metadata = {
  title: "Employer dashboard (preview) | Oaksoft Payments",
  description: "Preview of the Oaksoft Payments employer dashboard with sample data.",
  robots: { index: false, follow: false },
};

export default function PaymentsDashboardPage() {
  return <PaymentsDashboard />;
}
