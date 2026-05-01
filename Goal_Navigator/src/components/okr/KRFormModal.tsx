import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPANY_OKRS_NAMES } from "@/types/okr";
import { CLOSING_MONTHS, CLOSING_MONTH_LABELS, CURRENT_CLOSING_MONTH, type ClosingMonth } from "@/lib/kr-mapper";
import { Save, Loader2 } from "lucide-react";

export interface KRFormValues {
  name: string;
  companyOkrName: string;
  baseline: number;
  target: number;
  weight: number;
  closingMonth: ClosingMonth;
}

interface KRFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: KRFormValues) => Promise<void>;
  initialValues?: Partial<KRFormValues>;
  mode: "add" | "edit";
  saving?: boolean;
}


export function KRFormModal({ open, onClose, onSubmit, initialValues, mode, saving }: KRFormModalProps) {
  const [name, setName] = useState("");
  const [pillar, setPillar] = useState("");
  const [baseline, setBaseline] = useState(0);
  const [target, setTarget] = useState(100);
  const [weight, setWeight] = useState(0);
  const [closingMonth, setClosingMonth] = useState<ClosingMonth>(CURRENT_CLOSING_MONTH);

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? "");
      setPillar(initialValues?.companyOkrName ?? "");
      setBaseline(initialValues?.baseline ?? 0);
      setTarget(initialValues?.target ?? 100);
      setWeight(initialValues?.weight ?? 0);
      setClosingMonth(initialValues?.closingMonth ?? CURRENT_CLOSING_MONTH);
    }
  }, [
    open,
    initialValues?.name,
    initialValues?.companyOkrName,
    initialValues?.baseline,
    initialValues?.target,
    initialValues?.weight,
    initialValues?.closingMonth,
  ]);

  const canSubmit =
    name.trim().length > 0 &&
    (mode === "edit" || pillar.length > 0) &&
    !!closingMonth;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      name: name.toUpperCase(),
      companyOkrName: pillar,
      baseline,
      target,
      weight,
      closingMonth,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {mode === "add" ? "Añadir Objetivo" : "Editar Objetivo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="NOMBRE DEL INDICADOR"
              className="text-sm uppercase"
            />
          </div>

          {/* OKR Compañía dropdown - only on add */}
          {mode === "add" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">OKR Compañía</label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar OKR de compañía..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_OKRS_NAMES.map(n => (
                    <SelectItem key={n} value={n} className="text-sm">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mes de cierre (obligatorio) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mes de cierre</label>
            <Select value={closingMonth} onValueChange={(v) => setClosingMonth(v as ClosingMonth)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar mes..." />
              </SelectTrigger>
              <SelectContent>
                {CLOSING_MONTHS.map(m => (
                  <SelectItem key={m} value={m} className="text-sm">{CLOSING_MONTH_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Baseline & Target & Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Base</label>
              <Input
                type="number"
                value={baseline}
                onChange={(e) => setBaseline(Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Meta</label>
              <Input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Peso (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={weight}
                onChange={(e) => setWeight(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
              canSubmit && !saving
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "add" ? "Agregar" : "Guardar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
