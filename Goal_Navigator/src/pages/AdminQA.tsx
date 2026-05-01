import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { DataQualityPanel } from "@/components/admin/DataQualityPanel";

const AdminQAPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Validación QA" />
          <main className="flex-1 overflow-auto bg-muted/20 people-module-shell">
            <DataQualityPanel />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminQAPage;
