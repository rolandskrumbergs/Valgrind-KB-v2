import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const routeNames: Record<string, string> = {
  chat: "Lena Chat",
  organizations: "Organizations",
  members: "Members",
  articles: "Articles",
  courses: "Courses",
  "knowledge-bases": "Knowledge Bases",
  "ai-profiles": "AI Profiles",
  analytics: "Analytics",
  "manage-admins": "Manage Admins",
};

export function DashboardHeader() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const currentRoute = segments[0];
  const routeName = currentRoute ? routeNames[currentRoute] ?? currentRoute : "Dashboard";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 bg-muted-foreground/40"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.length === 0 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${currentRoute}`}>
                    {routeName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {segments.length > 1 && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate max-w-[450px]">
                        {segments[1]}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
