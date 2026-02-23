"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";
import { useBreadcrumbEntityName } from "@/hooks/use-breadcrumb-entity-name";
import { Skeleton } from "./ui/skeleton";

const DashboardHeader = React.memo(() => {
  const pathname = usePathname();
  const pathnameParts = pathname.split("/").filter(Boolean);

  const entityType = pathnameParts[0] as
    | "chat"
    | "customers"
    | "news"
    | "knowledge-base"
    | null;
  const entityId = pathnameParts.length > 1 ? pathnameParts[1] : null;

  const { entityName, isLoading } = useBreadcrumbEntityName(
    entityType,
    entityId,
  );

  const formatRouteName = (route: string) => {
    if (route === "knowledge-base") return "Knowledge Base";
    if (route === "manage-admins") return "Manage Admins";
    if (route === "manage-users") return "Manage Users";
    return route.charAt(0).toUpperCase() + route.slice(1);
  };

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
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/${pathnameParts[0]}`}
                className="capitalize"
              >
                {pathnameParts[0] ? formatRouteName(pathnameParts[0]) : ""}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40" />
            <BreadcrumbItem>
              {pathnameParts.length > 1 &&
                (isLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <BreadcrumbPage className="truncate max-w-[450px]">
                    {entityName || pathnameParts[1]}
                  </BreadcrumbPage>
                ))}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
});

DashboardHeader.displayName = "DashboardHeader";

export default DashboardHeader;
