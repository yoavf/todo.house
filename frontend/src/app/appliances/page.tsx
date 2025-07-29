"use client";

import { format } from "date-fns";
import { Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockAppliances } from "@/lib/mock-data";

export default function AppliancesPage() {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredAppliances = mockAppliances.filter(
		(appliance) =>
			appliance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			appliance.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
			appliance.category.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="p-4 md:p-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">
					Appliances & Warranties
				</h1>
				<p className="text-gray-600 mt-1">
					Track your home appliances and their warranties
				</p>
			</div>

			{/* Actions Bar */}
			<div className="flex flex-col md:flex-row gap-4 mb-8">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search appliances by name, model or type..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Add Appliance
				</Button>
			</div>

			{/* Appliances Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{filteredAppliances.map((appliance) => {
					const warrantyDaysLeft = Math.floor(
						(appliance.warrantyUntil.getTime() - Date.now()) /
							(24 * 60 * 60 * 1000),
					);
					const warrantyExpired = warrantyDaysLeft < 0;
					const warrantyExpiringSoon =
						warrantyDaysLeft >= 0 && warrantyDaysLeft < 90;

					return (
						<Card key={appliance.id} className="overflow-hidden">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-gray-100">
											<Package className="h-5 w-5 text-gray-600" />
										</div>
										<div>
											<CardTitle className="text-xl">
												{appliance.name}
											</CardTitle>
											<CardDescription>{appliance.category}</CardDescription>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-sm text-gray-600">
									Model: {appliance.model}
								</div>

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-gray-500">Purchase Date</p>
										<p className="font-medium">
											{format(appliance.purchaseDate, "MMM d, yyyy")}
										</p>
									</div>
									<div>
										<p className="text-gray-500">Warranty Until</p>
										<p className="font-medium">
											{format(appliance.warrantyUntil, "MMM d, yyyy")}
										</p>
									</div>
								</div>

								{appliance.lastService && (
									<div className="text-sm">
										<p className="text-gray-500">Last Service</p>
										<p className="font-medium">
											{format(appliance.lastService, "MMM d, yyyy")}
										</p>
									</div>
								)}

								{!appliance.lastService && (
									<div className="text-sm">
										<p className="text-gray-500">Last Service</p>
										<p className="font-medium">Never</p>
									</div>
								)}

								<div className="flex items-center justify-between pt-2">
									<div className="flex gap-2">
										{warrantyExpired && (
											<Badge
												variant="secondary"
												className="bg-gray-100 text-gray-700"
											>
												Warranty Expired
											</Badge>
										)}
										{warrantyExpiringSoon && (
											<Badge
												variant="secondary"
												className="bg-orange-100 text-orange-700"
											>
												{warrantyDaysLeft} days left
											</Badge>
										)}
										{!warrantyExpired && !warrantyExpiringSoon && (
											<Badge
												variant="secondary"
												className="bg-green-100 text-green-700"
											>
												Under Warranty
											</Badge>
										)}
									</div>
									<div className="flex gap-2">
										<Button variant="ghost" size="sm">
											Service History
										</Button>
										<Button variant="ghost" size="sm">
											Edit Details
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
