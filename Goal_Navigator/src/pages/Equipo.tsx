import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import LeaderView from "@/components/okr/LeaderView";

const EquipoPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Mi equipo" />
          <main className="flex-1 overflow-auto people-module-shell">
            <LeaderView />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EquipoPage;
