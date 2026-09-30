import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const categories = await db.category.findMany({ orderBy: { sort: "asc" }, select: { id: true, name: true } });
  const product = id === "new" ? null : await db.product.findUnique({ where: { id } });
  if (id !== "new" && !product) notFound();

  return (
    <>
      <p className="crumbs" style={{ paddingTop: 0 }}><Link href="/admin/products">Products</Link><span>/</span><span>{product ? product.name : "New product"}</span></p>
      <div className="admin-head">
        <h1>{product ? `Edit ${product.name}` : "Add a product"}</h1>
        {product && <Link className="link" href={`/product/${product.slug}`} target="_blank">View in shop</Link>}
      </div>
      <ProductForm
        categories={categories}
        product={product && {
          id: product.id, name: product.name, brand: product.brand, label: product.label, size: product.size, slug: product.slug,
          categoryId: product.categoryId, price: (product.priceCents / 100).toFixed(2), was: product.wasCents ? (product.wasCents / 100).toFixed(2) : "",
          stock: String(product.stock), description: product.description, allergens: product.allergens, origin: product.origin,
          imageUrl: product.imageUrl ?? "", packBg: product.packBg, packFg: product.packFg, packShape: product.packShape,
          popular: product.popular, active: product.active,
          netQuantity: product.netQuantity != null ? String(product.netQuantity) : "", netUnit: product.netUnit ?? "g",
          ingredients: product.ingredients, nutrition: product.nutrition, storage: product.storage, foodOperator: product.foodOperator,
        }}
      />
    </>
  );
}
