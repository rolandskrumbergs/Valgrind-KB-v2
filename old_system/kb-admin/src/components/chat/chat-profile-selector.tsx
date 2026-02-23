import React, { useEffect, useState, useRef } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Settings } from "lucide-react";
import { LenaConfig } from "@/components/lena/lena-config";
import { useLenaProfiles } from "@/hooks/lena/use-lenaprofiles";
import type { LenaProfiles } from "@/db/schema";
import type { LenaProfile } from "@/db/queries/lena-queries";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

const ChatProfileSelector = ({
	setSelectedProfileID,
	lenaProfile,
}: {
	setSelectedProfileID: (profileID: string | undefined) => void;
	lenaProfile: LenaProfile | undefined;
}) => {
	const {
		lenaProfiles,
		isLoading,
		mutate: mutateLenaProfiles,
	} = useLenaProfiles();

	const [openDropdown, setOpenDropdown] = useState(false);
	const [previousProfile, setPreviousProfile] = useState<
		LenaProfiles | undefined
	>();
	const hasInitialized = useRef(false);

	const [selectedProfile, setSelectedProfile] = useState<
		LenaProfiles | undefined
	>(
		lenaProfile
			? lenaProfiles.find((profile) => profile.id === lenaProfile.id)
			: lenaProfiles.find((profile) => profile.active) || undefined,
	);

	useEffect(() => {
		// Initialize only if lenaProfile wasn't provided and we haven't initialized yet
		if (
			!lenaProfile &&
			lenaProfiles.length > 0 &&
			!isLoading &&
			!hasInitialized.current
		) {
			const activeProfile = lenaProfiles.find((profile) => profile.active);
			if (activeProfile) {
				setSelectedProfile(activeProfile);
				hasInitialized.current = true;
			}
		}
	}, [lenaProfile, lenaProfiles, isLoading]);

	useEffect(() => {
		if (selectedProfile && lenaProfiles.length > 0) {
			const updatedProfile = lenaProfiles.find(
				(profile) => profile.id === selectedProfile.id,
			);
			if (
				updatedProfile &&
				JSON.stringify(updatedProfile) !== JSON.stringify(selectedProfile)
			) {
				setSelectedProfile(updatedProfile);
			}
		}
	}, [lenaProfiles, selectedProfile]);

	const handleProfileChange = (value: string) => {
		if (value === "create-new-profile") {
			setPreviousProfile(selectedProfile);
			setSelectedProfile(undefined);
			setOpenDropdown(true);
		} else {
			const newSelectedProfile = lenaProfiles.find(
				(profile) => profile.id === value,
			);
			setSelectedProfile(newSelectedProfile || undefined);

			if (newSelectedProfile && !newSelectedProfile.active) {
				setSelectedProfileID(newSelectedProfile.id);
			}
		}
	};

	if (isLoading) {
		return (
			<Skeleton className="h-6 w-32 rounded-md flex items-center justify-center" />
		);
	}

	return (
		<div className="flex flex-row items-center gap-2 h-6">
			{/* <p className="text-xs text-muted-foreground">Lena Profile</p> */}
			<div className="flex flex-row  h-6 rounded-md bg-foreground overflow-hidden">
				<Select
					value={selectedProfile?.id || "create-new-profile"}
					onValueChange={handleProfileChange}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<SelectTrigger
								id="profile"
								className="h-full rounded-r-none bg-transparent border-none cursor-pointer"
							>
								<SelectValue placeholder="Select profile" className="h-full" />
							</SelectTrigger>
						</TooltipTrigger>
						<TooltipContent side="top">
							Select a profile to use for this chat
						</TooltipContent>
					</Tooltip>
					<SelectContent className="bg-muted" side="bottom" sideOffset={20}>
						{lenaProfiles.map((profile) => (
							<SelectItem
								key={profile.id}
								value={profile.id}
								className="cursor-pointer"
							>
								<div className="flex flex-row gap-2 items-center justify-between  w-fit">
									<div className="text-muted-foreground">
										{profile.profileName}
									</div>

									{profile.active && (
										<div className="text-[11px] text-black bg-green-500 rounded-lg px-1.5 py-[1px]">
											Live
										</div>
									)}
								</div>
							</SelectItem>
						))}
						<SelectSeparator />
						<SelectItem value="create-new-profile" className="cursor-pointer">
							<div className="text-muted-foreground">Create profile</div>
						</SelectItem>
					</SelectContent>
				</Select>

				<DropdownMenu
					open={openDropdown}
					onOpenChange={(open) => {
						setOpenDropdown(open);
						if (!open && !selectedProfile) {
							setSelectedProfile(previousProfile);
						}
					}}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger
								className={cn(
									"text-sm bg-white  p-1 flex items-center h-full border-l border-border/30 justify-center cursor-pointer text-muted-foreground hover:text-black",
									selectedProfile === undefined && "disabled:opacity-50",
								)}
							>
								{selectedProfile === undefined ? (
									<Plus className="w-4 h-4 " />
								) : (
									<Settings className="w-4 h-4 " />
								)}
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent side="right">
							{selectedProfile === undefined
								? "Create a new profile"
								: "Configure this profile"}
						</TooltipContent>
					</Tooltip>

					<DropdownMenuContent
						className="-translate-x-32 p-0 rounded-xl shadow-lg shadow-black/50 border border-border"
						side="bottom"
						align="start"
						sideOffset={20}
					>
						<div className="h-full max-w-xl w-full bg-muted">
							<LenaConfig
								selectedProfile={selectedProfile}
								mutateLenaProfiles={mutateLenaProfiles}
								setSelectedProfile={setSelectedProfile}
								setOpenDropdown={setOpenDropdown}
							/>
						</div>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

export default ChatProfileSelector;
