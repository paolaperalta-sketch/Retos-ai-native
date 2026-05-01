import { useEffect, useState } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, X, Search } from "lucide-react";

type Person = {
  email: string;
  full_name: string;
  area: string;
  cargo: string;
  rol: string;
};

function rolToRole(rol: string): AppRole {
  const r = rol.toLowerCase();
  if (r.includes("super")) return "super_admin";
  if (r === "admin") return "global_leader";
  if (r.includes("líder") || r === "lider" || r.includes("leader")) return "team_leader";
  return "individual_contributor";
}

export function ImpersonationBanner() {
  const { realRole, impersonating, startImpersonation, stopImpersonation } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (realRole !== "super_admin") return;
    supabase
      .from("users_master")
      .select("email, full_name, area, cargo, rol")
      .order("full_name", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Could not load users for impersonation", error);
          return;
        }
        setPeople((data || []) as Person[]);
      });
  }, [realRole]);

  if (realRole !== "super_admin") return null;

  if (impersonating) {
    return (
      <div className="w-full bg-primary/10 border-b border-primary/30 text-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold shrink-0">QA · Viendo como:</span>
          <span className="truncate">
            {impersonating.fullName} <span className="text-muted-foreground">({impersonating.email})</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          onClick={() => {
            stopImpersonation();
            window.location.reload();
          }}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Salir
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/40 border-b border-border px-4 py-1.5 flex items-center justify-end text-xs">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Ver como otro usuario (QA)
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Buscar por nombre, email o área..." />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup heading={`${people.length} personas`}>
                {people.map((p) => (
                  <CommandItem
                    key={p.email}
                    value={`${p.full_name} ${p.email} ${p.area} ${p.cargo}`}
                    onSelect={async () => {
                      // Look up the impersonated user's auth user_id from profiles
                      // so queries that filter by user_id (Mi Desempeño, etc.) load their data.
                      const { data: profile } = await supabase
                        .from("profiles")
                        .select("user_id")
                        .eq("email", p.email)
                        .maybeSingle();
                      startImpersonation({
                        email: p.email,
                        fullName: p.full_name,
                        role: rolToRole(p.rol),
                        userId: profile?.user_id ?? null,
                      });
                      setOpen(false);
                      window.location.reload();
                    }}
                    className="flex flex-col items-start gap-0.5 py-2 pl-4 border-l-[3px] border-l-transparent transition-[background-color,border-color,padding] duration-150 ease-out data-[selected=true]:bg-muted/60 data-[selected=true]:!text-foreground data-[selected=true]:border-l-primary data-[selected=true]:pl-[13px]"
                  >
                    <span className="font-medium text-sm text-foreground">{p.full_name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.email} · {p.area} · {p.cargo}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
