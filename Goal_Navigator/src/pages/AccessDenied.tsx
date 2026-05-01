import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
        <p className="text-sm text-muted-foreground">
          No tienes permisos para acceder a esta sección. Tu nivel de acceso solo te permite visualizar la información correspondiente a tu rol asignado.
        </p>
        <button
          onClick={() => navigate("/desempeno", { replace: true })}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors border-none cursor-pointer"
        >
          Ir a Mi Desempeño
        </button>
      </div>
    </div>
  );
}
