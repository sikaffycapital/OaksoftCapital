import DemoProvider from "@/components/payments/DemoProvider";
import "@/components/payments/payments.css";

export default function PaymentsLayout({ children }) {
  return <DemoProvider>{children}</DemoProvider>;
}
