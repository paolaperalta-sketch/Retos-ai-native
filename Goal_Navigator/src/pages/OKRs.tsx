import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";
import { OKR_ICONS } from "@/lib/okr-icons";
import { Rocket, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BiaTag from "@/components/bia/BiaTag";
import { sentenceCaseTitle } from "@/lib/text-utils";

const getIcon = (name: string): LucideIcon =>
  OKR_ICONS[name.toUpperCase()] || OKR_ICONS[name] || Rocket;

interface OKRItem {
  name: string;
  description: string;
  tag: string;
}

const OKR_LIST: OKRItem[] = [
  {
    name: "AI NATIVE",
    tag: "Transversal",
    description:
      "Convertir a Bia en la primera organización AI-native del sector energético global, haciendo de AI el sistema operativo de cómo trabajamos y no solo una herramienta.",
  },
  {
    name: "GROWTH ENGINE",
    tag: "Growth",
    description:
      "$100M → $250M AA en 12 meses con eficiencia creciente, demostrando que energía + tech + datos crean un flywheel que los incumbentes no pueden replicar.",
  },
  {
    name: "BANKING & BANCABILIDAD",
    tag: "Growth",
    description:
      "Hacer de la estructura financiera de Bia un asset estratégico que compita con utilities de larga trayectoria crediticia, habilitando acceso a capital más barato para crecer más rápido.",
  },
  {
    name: "LIFECYCLE",
    tag: "Flywheel",
    description:
      "Construir un sistema inteligente que unifique el ciclo de vida del cliente desde el momento cero, creando una experiencia fluida, sorprendente y de alto valor que incentive naturalmente a los clientes a referir.",
  },
  {
    name: "NUEVAS LÍNEAS DE NEGOCIO",
    tag: "Flywheel",
    description:
      "Construir un motor de nuevos negocios que identifique, valide y escale oportunidades de valor agregado, integrando a la propuesta de Bia para fortalecer la oferta.",
  },
  {
    name: "DATA COMO FUENTE DE VERDAD",
    tag: "Flywheel",
    description:
      "Convertir el data advantage natural de Bia en el sistema nervioso central de la empresa, conectando toda la información clave y eliminando la intuición como método de gestión.",
  },
  {
    name: "FINANCE ENERGY (PROCUREMENT)",
    tag: "Inteligencia para el crecimiento rentable",
    description:
      "Construir una plataforma propietaria de procurement donde consumo en tiempo real, algoritmos de optimización y escala de compra creen un pricing advantage irreplicable.",
  },
  {
    name: "PREDICTABLE FINANCE",
    tag: "Inteligencia para el crecimiento rentable",
    description:
      "Lograr que el CFO, el CEO y los inversores puedan ver y predecir el estado real del negocio en cualquier momento con alta precisión, sin depender de cierres o reportes manuales.",
  },
  {
    name: "HABILITADORES DE NEGOCIO",
    tag: "Habilitador de Negocio",
    description:
      "Garantizar las capacidades operativas, legales, de talento y regulatorias que habilitan el crecimiento sostenible del negocio.",
  },
];

const FILTERS = ["Todos", "Transversal", "Growth", "Flywheel", "Inteligencia para el crecimiento rentable", "Habilitador de Negocio"] as const;
type Filter = (typeof FILTERS)[number];

const OKRsPage = () => {
  const [filter, setFilter] = useState<Filter>("Todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = OKR_LIST.filter((o) => filter === "Todos" || o.tag === filter);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Objetivos compañía" />

          <main className="flex-1 overflow-auto people-module-shell">
            <div className="max-w-4xl mx-auto">
              <PageTitle
                breadcrumb="OBJETIVOS COMPAÑÍA"
                title="Objetivos Compañía"
                subtitle="Los pilares estratégicos que definen el rumbo de Bia"
              />

              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 mt-6 mb-6">
                {FILTERS.map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                        active
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {visible.map((item) => {
                  const Icon = getIcon(item.name);
                  const isOpen = expanded === item.name;
                  return (
                    <div
                      key={item.name}
                      className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm animate-fade-in"
                    >
                      <button
                        onClick={() => setExpanded(isOpen ? null : item.name)}
                        className="w-full flex items-center gap-3 px-4 text-left bg-transparent border-none cursor-pointer"
                        style={{ height: "56px" }}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {sentenceCaseTitle(item.name)}
                          </h3>
                          <BiaTag label={item.tag} color="purple" />
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pl-[60px] animate-accordion-down">
                          <p className="text-sm leading-relaxed text-muted-foreground font-normal">
                            {item.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OKRsPage;
