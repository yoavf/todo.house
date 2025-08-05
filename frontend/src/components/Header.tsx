import { SettingsIcon } from "lucide-react";
import Link from "next/link";

export function Header() {
	return (
		<div className="flex justify-between items-center mb-6">
			<Link
				href="/"
				className="text-3xl font-bold text-gray-800 hover:text-gray-900 transition-colors text-start"
			>
				todo.house
			</Link>
			<Link href="/settings" className="p-2 text-gray-600 hover:text-gray-900">
				<SettingsIcon size={20} />
			</Link>
		</div>
	);
}
