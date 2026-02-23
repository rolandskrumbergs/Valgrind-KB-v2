"use client";

import type * as React from "react";
import {
  Building2,
  LifeBuoy,
  Send,
  Brain,
  MessageSquare,
  UserRound,
  Users,
  Newspaper,
  Bell,
  BarChart,
  GraduationCapIcon,
} from "lucide-react";
import Image from "next/image";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavCustomers } from "@/components/sidebar/nav-customers";
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
import { usePathname } from "next/navigation";
import { NavAdmin } from "./nav-admin";
import { NavLena } from "./nav-lena";

const data = {
  navAdmin: [
    {
      title: "Manage Admins",
      url: "/manage-admins",
      icon: UserRound,
    },
    {
      title: "Manage Users",
      url: "/manage-users",
      icon: Users,
    },
    {
      title: "Manage Customers",
      url: "/customers",
      icon: Building2,
    },
    {
      title: "Manage News",
      url: "/news",
      icon: Newspaper,
    },
    {
      title: "Educations",
      url: "/educations",
      icon: GraduationCapIcon,
    },
  ],
  navMain: [
    {
      title: "Lena Chat",
      url: "/chat",
      icon: MessageSquare,
    },
  ],
  navLena: [
    {
      title: "Knowledge Base",
      url: "/knowledge-base",
      icon: Brain,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "https://intressebevakaren.se/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "https://intressebevakaren.se/feedback",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const pathnameParts = pathname.split("/").filter(Boolean);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} pathname={`/${pathnameParts[0]}`} />
        <NavAdmin items={data.navAdmin} pathname={`/${pathnameParts[0]}`} />
        <NavLena items={data.navLena} pathname={`/${pathnameParts[0]}`} />
        <NavCustomers />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

const SidebarLogo = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <div className="flex items-center gap-2">
            <div className="bg-white flex aspect-square size-8 items-center justify-center rounded-lg">
              <Image src="/icon.png" alt="IBBEN" width={32} height={32} />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold">IBBEN</span>
              <span className="truncate text-xs">Admin Dashboard</span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
