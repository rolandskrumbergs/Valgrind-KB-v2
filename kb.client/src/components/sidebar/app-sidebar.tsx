import { useLocation, Link } from "react-router-dom";
import {
  Building2,
  LifeBuoy,
  Send,
  Brain,
  MessageSquare,
  UserRound,
  Users,
  Newspaper,
  BarChart,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NavGroup } from "@/components/sidebar/nav-group";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const navMain: NavItem[] = [
  { title: "Lena Chat", url: "/chat", icon: MessageSquare },
];

const navAdmin: NavItem[] = [
  { title: "Manage Admins", url: "/manage-admins", icon: UserRound },
  { title: "Members", url: "/members", icon: Users },
  { title: "Organizations", url: "/organizations", icon: Building2 },
  { title: "Articles", url: "/articles", icon: Newspaper },
  { title: "Courses", url: "/courses", icon: GraduationCap },
];

const navLena: NavItem[] = [
  { title: "Knowledge Bases", url: "/knowledge-bases", icon: Brain },
  { title: "AI Profiles", url: "/ai-profiles", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart },
];

const navSecondaryItems: NavItem[] = [
  { title: "Support", url: "https://intressebevakaren.se/support", icon: LifeBuoy },
  { title: "Feedback", url: "https://intressebevakaren.se/feedback", icon: Send },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation();
  const currentPath = "/" + pathname.split("/").filter(Boolean)[0];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="sidebar-scrollbar">
        <NavGroup items={navMain} pathname={currentPath} />
        <NavGroup label="Admin Tools" items={navAdmin} pathname={currentPath} />
        <NavGroup label="Lena AI" items={navLena} pathname={currentPath} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white flex aspect-square size-8 items-center justify-center rounded-lg text-black font-bold text-xs">
              IB
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold">IBBEN</span>
              <span className="truncate text-xs">Admin Dashboard</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
