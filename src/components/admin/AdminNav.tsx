"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Dashboard", icon: "chart" },
  { href: "/admin/orders", label: "Orders", icon: "list" },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/delivery", label: "Delivery", icon: "truck" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      {LINKS.map((l) => {
        const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}><Icon name={l.icon} />{l.label}</Link>;
      })}
    </nav>
  );
}
