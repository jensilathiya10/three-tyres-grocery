import type { CSSProperties } from "react";

type PackProduct = {
  name: string;
  brand: string;
  label: string;
  size: string;
  stock: number;
  imageUrl: string | null;
  packBg: string;
  packFg: string;
  packShape: string;
};

const SHAPES = new Set(["sack", "box", "pouch", "jar"]);

/** Product photo when one is uploaded, otherwise a drawn pack in the product's colours. */
export function PackArt({ p }: { p: PackProduct }) {
  const style = { "--pb": p.packBg, "--pf": p.packFg } as CSSProperties;
  const shape = SHAPES.has(p.packShape) ? p.packShape : "box";
  return (
    <div className={`art${p.stock > 0 ? "" : " oos"}`} style={style}>
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- images come from any host the shop owner pastes in
        <img src={p.imageUrl} alt={`${p.brand} ${p.name}`} loading="lazy" />
      ) : (
        <div className={`pack pack-${shape}`} aria-hidden="true">
          <span className="pb">{p.brand}</span>
          <span className="pn">{p.label}</span>
          <span className="ps">{p.size}</span>
        </div>
      )}
    </div>
  );
}
