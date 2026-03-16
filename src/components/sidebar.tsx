"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/lists", label: "リスト", icon: List },
  { href: "/campaigns", label: "キャンペーン", icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-64 flex-col border-r bg-card"
      data-karma-role="navigation"
      data-karma-test-id="sidebar"
    >
      <div className="p-6">
        <h1 className="text-lg font-bold tracking-tight">DAWN MAIL</h1>
        <p className="text-xs text-muted-foreground">メール配信管理</p>
      </div>
      <Separator />
      <nav className="flex-1 p-4">
        <ul className="grid gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-karma-action={`navigate:${item.label}`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t p-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            data-karma-action="signout"
            data-karma-test-id="signout-button"
          >
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
