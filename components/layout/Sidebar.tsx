import Link from "next/link";
import { BookOpen, Home, LayoutDashboard, Shield, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Cursos", icon: BookOpen },
  { href: "/profile", label: "Perfil", icon: User },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">HackLearn</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">🔥 Streak</p>
          <p className="mt-1">0 dias seguidos</p>
        </div>
      </div>
    </aside>
  );
}
