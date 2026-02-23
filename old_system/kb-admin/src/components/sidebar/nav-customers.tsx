"use client";

import { Folder, MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useCustomerNav } from "@/hooks/customers/use-customer-nav";

export function NavCustomers() {
	const { isMobile } = useSidebar();
	const { customers, totalCount, isLoading, error } = useCustomerNav();

	if (error) {
		console.error("Error fetching customers:", error);
	}

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>
				Customers
				{!isLoading && totalCount > 0 && (
					<span className="ml-1 text-xs text-muted-foreground">
						({totalCount})
					</span>
				)}
			</SidebarGroupLabel>
			<SidebarMenu>
				{isLoading ? (
					<SidebarMenuItem>
						<span className="text-muted-foreground">Loading...</span>
					</SidebarMenuItem>
				) : customers.length === 0 ? (
					<SidebarMenuItem>
						<span className="text-muted-foreground">No customers</span>
					</SidebarMenuItem>
				) : (
					<>
						{customers.map((item) => (
							<SidebarMenuItem key={item.name}>
								<SidebarMenuButton asChild>
									<Link href={item.url}>
										<span>{item.name}</span>
									</Link>
								</SidebarMenuButton>
								{/* <DropdownMenu>
									<DropdownMenuTrigger asChild>
										<SidebarMenuAction showOnHover>
											<MoreHorizontal />
											<span className="sr-only">More</span>
										</SidebarMenuAction>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										className="w-48"
										side={isMobile ? "bottom" : "right"}
										align={isMobile ? "end" : "start"}
									>
										<DropdownMenuItem asChild>
											<Link href={item.url}>
												<Folder className="mr-2 h-4 w-4 text-muted-foreground" />
												<span>View Customer</span>
											</Link>
										</DropdownMenuItem>

										<DropdownMenuSeparator />
									</DropdownMenuContent>
								</DropdownMenu> */}
							</SidebarMenuItem>
						))}
						{totalCount > 5 && (
							<SidebarMenuItem>
								<span className="text-xs text-muted-foreground px-2">
									Showing 5 of {totalCount}
								</span>
							</SidebarMenuItem>
						)}
					</>
				)}
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<Link href="/customers">
							<MoreHorizontal />
							<span>All Customers</span>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
