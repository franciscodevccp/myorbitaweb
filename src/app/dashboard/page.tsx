import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, StickyNote, Search, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

const modules = [
  {
    href: "/dashboard/books",
    title: "Biblioteca de Documentos",
    description: "Libros, lecturas y PDFs subidos",
    detail: "Gestiona tu colección académica.",
    icon: BookOpen,
    iconBg: "bg-primary/10 text-primary",
    className: "md:col-span-2 lg:col-span-2",
  },
  {
    href: "/dashboard/calendar",
    title: "Calendario",
    description: "Próximos eventos",
    detail: "Tus fechas clave.",
    icon: Calendar,
    iconBg: "bg-[var(--info-light)] text-[var(--info)]",
    className: "md:col-span-1 lg:col-span-1",
  },
  {
    href: "/dashboard/notes",
    title: "Apuntes Rápidos",
    description: "Notas fijadas y borradores",
    detail: "Tus ideas a mano.",
    icon: StickyNote,
    iconBg: "bg-[var(--warning-light)] text-[var(--warning)]",
    className: "md:col-span-1 lg:col-span-1",
  },
  {
    href: "/dashboard/search",
    title: "Búsqueda Global",
    description: "Encuentra cualquier concepto dentro de todos tus PDFs al instante",
    detail: "Ir al buscador",
    icon: Search,
    iconBg: "bg-primary/15 text-primary",
    isLink: true,
    className: "md:col-span-2 lg:col-span-2",
  },
  {
    href: "/dashboard/settings",
    title: "Notificaciones Bot",
    description: "Estado de conexión con Telegram",
    detail: "Vincular y gestionar alertas en tu móvil.",
    icon: Settings,
    iconBg: "bg-secondary text-foreground",
    className: "md:col-span-1 lg:col-span-3",
  },
];

export default function DashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-background-secondary border border-border p-8 sm:p-12 shadow-sm flex flex-col justify-center min-h-[280px]">
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
            Bienvenido a tu <br /><span className="text-primary italic">espacio de arquitectura.</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-xl leading-relaxed">
            Sube tus apuntes, explora el contenido con la asistencia de la IA y organiza tus fechas de entregas.
          </p>
        </div>

        {/* Decorative elements - shapes that match the warm coffee aesthetic */}
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute right-32 bottom-0 w-[300px] h-[300px] bg-[var(--accent)]/20 rounded-full blur-[60px] translate-y-1/3"></div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ href, title, description, detail, icon: Icon, iconBg, isLink, className }) => (
          <Link key={href} href={href} className={`block h-full group outline-none ${className || ""}`}>
            <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border-border/60 hover:border-primary/50 group-active:scale-[0.98] bg-card overflow-hidden relative">

              {/* Card Background Decoration */}
              <div className="absolute -right-8 -top-8 size-32 bg-background-secondary rounded-full opacity-50 transition-transform duration-500 group-hover:scale-[2.5] group-hover:bg-primary/5"></div>

              <CardHeader className="relative z-10 flex flex-row items-start gap-4 pb-4">
                <div
                  className={`flex size-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${iconBg}`}
                >
                  <Icon className="size-6 shrink-0" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <h2 className="font-sans text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h2>
                  <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-snug">
                    {description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 mt-auto pt-6">
                <div className="flex items-center justify-between w-full bg-background-secondary/40 rounded-xl p-4 border border-border/40 group-hover:bg-primary/5 transition-colors">
                  <span className={`text-sm font-medium ${isLink ? 'text-primary' : 'text-foreground/80'}`}>
                    {detail}
                  </span>
                  {isLink ? (
                    <ArrowRight className="size-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                  ) : <div />}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
