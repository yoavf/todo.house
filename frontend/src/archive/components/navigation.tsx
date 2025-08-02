"use client";

import {
	CheckSquare,
	Home,
	LogOut,
	Menu,
	Package,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/", label: "Dashboard", icon: Home },
	{ href: "/tasks", label: "Tasks", icon: CheckSquare },
	{ href: "/appliances", label: "Appliances", icon: Package },
	{ href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
	const pathname = usePathname();

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
				<div className="flex flex-col flex-1 overflow-y-auto">
					<div className="px-4 py-5">
						<Link href="/" className="text-2xl font-bold text-blue-600">
							TodoHouse
						</Link>
						<p className="text-sm text-gray-500 mt-1">
							Your home's best friend
						</p>
					</div>

					<nav className="flex-1 px-2 pb-4 space-y-1">
						{navItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
										pathname === item.href
											? "bg-blue-50 text-blue-700"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
									)}
								>
									<Icon className="mr-3 h-5 w-5" />
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="px-2 pb-4">
						<Button
							variant="ghost"
							className="w-full justify-start text-gray-600 hover:text-gray-900"
						>
							<LogOut className="mr-3 h-5 w-5" />
							Sign Out
						</Button>
					</div>
				</div>
			</aside>

			{/* Mobile Header */}
			<header className="lg:hidden bg-white border-b border-gray-200">
				<div className="flex items-center justify-between p-4">
					<Link href="/" className="text-2xl font-bold text-blue-600">
						TodoHouse
					</Link>

					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-6 w-6" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 p-0">
							<div className="flex flex-col h-full">
								<div className="px-4 py-5">
									<p className="text-2xl font-bold text-blue-600">TodoHouse</p>
									<p className="text-sm text-gray-500 mt-1">
										Your home's best friend
									</p>
								</div>

								<nav className="flex-1 px-2 space-y-1">
									{navItems.map((item) => {
										const Icon = item.icon;
										return (
											<Link
												key={item.href}
												href={item.href}
												className={cn(
													"group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
													pathname === item.href
														? "bg-blue-50 text-blue-700"
														: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
												)}
											>
												<Icon className="mr-3 h-5 w-5" />
												{item.label}
											</Link>
										);
									})}
								</nav>

								<div className="px-2 pb-4">
									<Button
										variant="ghost"
										className="w-full justify-start text-gray-600 hover:text-gray-900"
									>
										<LogOut className="mr-3 h-5 w-5" />
										Sign Out
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</header>

			{/* Main Content Wrapper */}
			<div className="lg:pl-64">
				{/* This empty div provides the left padding for desktop */}
			</div>
		</>
	);
}
