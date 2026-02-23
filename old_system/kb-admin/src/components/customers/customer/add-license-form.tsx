import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Customer } from "@/db/schema";
import { BulkUploadForm } from "./bulk-add-users";
import { IndividualLicenseForm } from "./individual-add-user";

const AddLicenseForm = ({
	setOpen,
	customer,
}: { setOpen: (open: boolean) => void; customer: Customer }) => {
	return (
		<div className="flex flex-col ">
			<Tabs defaultValue="individual" className="w-full gap-0">
				<TabsList className="grid w-full grid-cols-2  rounded-b-none">
					<TabsTrigger value="individual" className="cursor-pointer">
						Add Individual License
					</TabsTrigger>
					<TabsTrigger value="bulk" className="cursor-pointer">
						Bulk Upload
					</TabsTrigger>
				</TabsList>
				<TabsContent value="individual">
					<IndividualLicenseForm setOpen={setOpen} customer={customer} />
				</TabsContent>
				<TabsContent value="bulk">
					<BulkUploadForm setOpen={setOpen} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default AddLicenseForm;
