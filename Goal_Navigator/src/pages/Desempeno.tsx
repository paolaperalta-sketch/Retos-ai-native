import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import CollaboratorView from "@/components/okr/CollaboratorView";

const DesempenoPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Mi desempeño" />
          <main className="flex-1 overflow-auto people-module-shell">
            <CollaboratorView />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DesempenoPage;
