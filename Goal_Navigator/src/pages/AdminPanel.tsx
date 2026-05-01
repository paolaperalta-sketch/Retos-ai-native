import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PageHeader } from "@/components/PageHeader";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const AdminPanelPage = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader section="Panel empresa" />
          <main className="flex-1 overflow-auto bg-muted/20 people-module-shell">
            <AdminDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanelPage;
