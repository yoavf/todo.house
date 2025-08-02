import { SettingsIcon } from "lucide-react";
import Link from "next/link";

export function Header() {
	return (
		<div className="flex justify-between items-center mb-6">
			<h1 className="text-3xl font-bold text-gray-800">todo.house</h1>
			<Link href="/settings" className="p-2 text-gray-600 hover:text-gray-900">
				<SettingsIcon size={20} />
			</Link>
		</div>
	);
}
