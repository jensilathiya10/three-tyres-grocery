import Link from "next/link";
import type { Metadata } from "next";
import { logout } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/shop/Chrome";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link className="logo" href="/admin"><Logo /></Link>
        <AdminNav />
        <div className="foot">
          <Link className="link" href="/" target="_blank">View shop <Icon name="arrow" /></Link>
          <form action={logout}><button className="link" style={{ color: "var(--muted)" }}><Icon name="logout" />Sign out</button></form>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
