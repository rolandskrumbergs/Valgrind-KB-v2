import { Settings } from "lucide-react";
import {
	Select,
	SelectTrigger,
	SelectItem,
	SelectValue,
	SelectContent,
} from "@/components/ui/select";
import React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChunkSettingsProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

const ChunkSettings = ({
	value = "set_a",
	onChange,
	disabled = false,
}: ChunkSettingsProps) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="relative">
						<Select value={value} onValueChange={onChange} disabled={disabled}>
							<SelectTrigger className="w-fit bg-background cursor-pointer px-3 flex gap-2">
								<Settings className="h-4 w-4" />
								<SelectValue placeholder="Chunking" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="set_a">
									More granular chunks for higher precision
								</SelectItem>
								<SelectItem value="set_b">
									Larger chunks for more context
								</SelectItem>
								<SelectItem value="set_c">
									Minimal overlap for storage efficiency
								</SelectItem>
								<SelectItem value="set_d">
									Title-based chunking for better semantic boundaries
								</SelectItem>
								<SelectItem value="set_e">
									Experimental small chunks for maximum precision
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>Select chunking strategy</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default ChunkSettings;
