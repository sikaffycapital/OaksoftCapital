import { notFound } from "next/navigation";
import CestoBasketDetail from "../../../components/CestoBasketDetail";
import { getBasketDetail } from "./data";

export default async function BasketDetailPage({ params }) {
  const { slug } = await params;
  const detail = await getBasketDetail(slug);
  if (!detail) notFound();

  return (
    <CestoBasketDetail
      key={detail.product.slug}
      product={detail.product}
      live={detail.live}
      publishableConfigured={Boolean(process.env.NEXT_PUBLIC_CESTO_PK)}
    />
  );
}
