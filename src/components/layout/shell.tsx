"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Search,
  Calendar,
  StickyNote,
  Settings,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/books", label: "Biblioteca", icon: BookOpen },
  { href: "/dashboard/search", label: "Buscar", icon: Search },
  { href: "/dashboard/calendar", label: "Calendario", icon: Calendar },
  { href: "/dashboard/notes", label: "Notas", icon: StickyNote },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
] as const;

function AppSidebarContent() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <>
      <SidebarHeader className="h-28 flex items-center justify-center px-6 pt-6 pb-2 mb-2 relative border-b border-sidebar-border shrink-0">
        {/* Resplandor sutil detrás del título */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        <Link
          href="/dashboard"
          className="flex items-center justify-center min-w-0 transition-transform duration-300 hover:scale-[1.02] group"
          onClick={() => setOpenMobile(false)}
        >
          <span className="font-display text-2xl font-semibold text-white tracking-wide truncate">
            MyOrbita
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      className={`h-12 w-full flex items-center gap-3.5 px-3.5 rounded-xl transition-all duration-300 border mb-1 object-cover ${isActive
                          ? "bg-primary text-white font-medium border-primary/20 shadow-lg shadow-primary/20"
                          : "bg-transparent text-sidebar-foreground/70 border-transparent hover:bg-white/5 hover:text-white hover:border-white/5"
                        }`}
                    >
                      <Link
                        href={href}
                        onClick={() => setOpenMobile(false)}
                        className="flex items-center w-full outline-none"
                      >
                        <Icon
                          className={`shrink-0 size-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className="text-[15px]">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Decorative footer element (e.g. user profile placeholder or subtle branding) */}
      <div className="mt-auto p-6 pb-8">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border/20 to-transparent mb-6"></div>
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <div className="size-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <span className="text-white text-xs font-semibold">MO</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">Estudiante</span>
            <span className="text-white/50 text-xs">V2.0</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar side="left" collapsible="offcanvas" className="border-r-0">
          <AppSidebarContent />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 md:px-6 transition-all duration-200 md:hidden">
            <SidebarTrigger
              className="md:hidden"
              aria-label="Abrir o cerrar menú"
            />
            <div className="flex-1 min-w-0" />
          </header>
          <main className="flex-1 w-full min-w-0 px-6 py-6 min-h-0 overflow-auto bg-background [&>*>:first-child]:mt-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
