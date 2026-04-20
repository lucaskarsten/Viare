"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SidebarUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function SidebarUserMenu({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-sidebar-primary truncate">{user?.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/profile")}>Perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>Configurações</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
