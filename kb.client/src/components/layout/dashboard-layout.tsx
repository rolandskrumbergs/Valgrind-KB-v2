import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col mt-0 my-2 mx-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
