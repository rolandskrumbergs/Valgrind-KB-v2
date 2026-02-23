import UploadDocument from "@/components/knowledge-base/upload-document";
import ManageDocuments from "@/components/knowledge-base/manage-documents";
import KnowledgeStats from "@/components/knowledge-base/knowledge-stats";

export default async function KnowledgeBasePage() {
	return (
		<div className="grid grid-cols-4 gap-2 h-full w-full">
			<div className="col-span-1 h-full w-full gap-2 flex flex-col">
				<UploadDocument />
				<KnowledgeStats />
			</div>
			<ManageDocuments />
		</div>
	);
}
