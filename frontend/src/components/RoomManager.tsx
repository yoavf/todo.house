"use client";

import { HomeIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Room {
	id: string;
	name: string;
	isDefault: boolean;
}

type DefaultRoomKey =
	| "livingRoom"
	| "kitchen"
	| "bathroom"
	| "bedroom"
	| "office"
	| "garage"
	| "backyard";

const DEFAULT_ROOMS: Room[] = [
	{ id: "living-room", name: "livingRoom", isDefault: true },
	{ id: "kitchen", name: "kitchen", isDefault: true },
	{ id: "bathroom", name: "bathroom", isDefault: true },
	{ id: "bedroom", name: "bedroom", isDefault: true },
	{ id: "office", name: "office", isDefault: true },
	{ id: "garage", name: "garage", isDefault: true },
	{ id: "backyard", name: "backyard", isDefault: true },
];

export function RoomManager() {
	const t = useTranslations("settings.rooms");
	const tDefault = useTranslations("settings.rooms.defaultRooms");
	const tCommon = useTranslations("common");

	const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
	const [editingRoom, setEditingRoom] = useState<Room | null>(null);
	const [newRoomName, setNewRoomName] = useState("");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	const handleAddRoom = () => {
		if (newRoomName.trim()) {
			const newRoom: Room = {
				id: `custom-${Date.now()}`,
				name: newRoomName.trim(),
				isDefault: false,
			};
			setRooms([...rooms, newRoom]);
			setNewRoomName("");
			setIsAddDialogOpen(false);
		}
	};

	const handleEditRoom = () => {
		if (editingRoom && newRoomName.trim()) {
			setRooms(
				rooms.map((room) =>
					room.id === editingRoom.id
						? { ...room, name: newRoomName.trim() }
						: room,
				),
			);
			setEditingRoom(null);
			setNewRoomName("");
			setIsEditDialogOpen(false);
		}
	};

	const handleDeleteRoom = (roomId: string) => {
		setRooms(rooms.filter((room) => room.id !== roomId));
	};

	const startEdit = (room: Room) => {
		setEditingRoom(room);
		setNewRoomName(
			room.isDefault ? tDefault(room.name as DefaultRoomKey) : room.name,
		);
		setIsEditDialogOpen(true);
	};

	const getRoomDisplayName = (room: Room) => {
		return room.isDefault ? tDefault(room.name as DefaultRoomKey) : room.name;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<HomeIcon className="text-orange-500" size={20} />
					<h2 className="text-lg font-semibold">{t("title")}</h2>
				</div>

				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger asChild>
						<Button
							variant="ghost"
							className="text-orange-500 hover:text-orange-600"
						>
							<PlusIcon size={16} />
							{t("addRoom")}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("addRoom")}</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="roomName">{t("roomName")}</Label>
								<Input
									id="roomName"
									value={newRoomName}
									onChange={(e) => setNewRoomName(e.target.value)}
									placeholder={t("roomName")}
								/>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setIsAddDialogOpen(false);
										setNewRoomName("");
									}}
								>
									{tCommon("cancel")}
								</Button>
								<Button onClick={handleAddRoom}>{tCommon("save")}</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="divide-y divide-gray-100">
				{rooms.map((room) => (
					<div key={room.id} className="flex items-center justify-between p-4">
						<span className="font-medium text-gray-800">
							{getRoomDisplayName(room)}
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => startEdit(room)}
								className="text-gray-500 hover:text-gray-700"
							>
								<PencilIcon size={16} />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleDeleteRoom(room.id)}
								className="text-gray-500 hover:text-red-600"
							>
								<TrashIcon size={16} />
							</Button>
						</div>
					</div>
				))}
			</Card>

			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("editRoom")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="editRoomName">{t("roomName")}</Label>
							<Input
								id="editRoomName"
								value={newRoomName}
								onChange={(e) => setNewRoomName(e.target.value)}
								placeholder={t("roomName")}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsEditDialogOpen(false);
									setEditingRoom(null);
									setNewRoomName("");
								}}
							>
								{tCommon("cancel")}
							</Button>
							<Button onClick={handleEditRoom}>{tCommon("save")}</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
