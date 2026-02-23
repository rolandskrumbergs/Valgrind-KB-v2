import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<Button asChild variant="default" className="rounded-md">
				<Link href="/login">Sign in</Link>
			</Button>
		</div>
	);
}
