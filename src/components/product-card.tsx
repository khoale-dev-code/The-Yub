import Image from "next/image";
import Link from "next/link";
import { formatVnd } from "@/lib/format";
import type { Product } from "@/modules/products/types";
import { AddToCartButton } from "./add-to-cart-button";
import { FavoriteButton } from "./favorite-button";
import { StatusBadge } from "./ui/status-badge";

/** The banh kieu "Bánh của tiệm" (anh 1/1.15 nen be, badge, tim, gia Fraunces, nut gio vien). */
export function ProductCard({ product, sizes = "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" }: { product: Product; sizes?: string }) {
  const href = `/san-pham/${product.slug}`;
  const soldOut = product.status === "out";
  return (
    <article className="flex flex-col gap-3.5">
      <div className="relative aspect-[1/1.15] overflow-hidden bg-beige">
        <Link href={href} aria-label={`Xem ${product.name}`} className="group block h-full w-full">
          <Image
            src={product.cover}
            alt={product.name}
            fill
            sizes={sizes}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${soldOut ? "grayscale-[40%]" : ""}`}
            style={{ objectPosition: product.imagePosition ?? "center" }}
          />
        </Link>
        <StatusBadge status={product.status} className="absolute left-3 top-3" />
        <FavoriteButton productId={product.id} name={product.name} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 font-display text-[21px] font-semibold leading-[1.25]">
          <Link href={href} className="no-underline">{product.name}</Link>
        </h3>
        <span className="text-sm text-muted-2">{product.tagline ?? product.description}</span>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span className="font-display text-xl font-semibold">{formatVnd(product.priceVnd)}</span>
          <AddToCartButton productId={product.id} productName={product.name} disabled={soldOut} variantId={product.variants?.[0]?.id} />
        </div>
      </div>
    </article>
  );
}
