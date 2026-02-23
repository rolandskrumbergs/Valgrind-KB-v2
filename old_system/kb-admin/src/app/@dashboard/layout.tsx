import DashboardHeader from "@/components/dashboard-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<DashboardHeader />
				<div className="flex flex-1 flex-col mt-0 m-2">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
