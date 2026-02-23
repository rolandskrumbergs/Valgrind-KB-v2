import TokenUsageTable from "@/components/lena/token-usage";

export default async function LenaAnalyticsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { page } = await searchParams;
	const pageNumber = Number(page) || 1;
	return <TokenUsageTable page={pageNumber} />;
}
