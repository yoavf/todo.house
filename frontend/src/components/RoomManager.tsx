"use client";

import {
	CheckIcon,
	HomeIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

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
	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [newRoomName, setNewRoomName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if ((editingRoomId || isAddingNew) && inputRef.current) {
			inputRef.current.focus();
		}
	}, [editingRoomId, isAddingNew]);

	const handleAddRoom = () => {
		if (newRoomName.trim()) {
			const newRoom: Room = {
				id: `custom-${Date.now()}`,
				name: newRoomName.trim(),
				isDefault: false,
			};
			setRooms([newRoom, ...rooms]);
			setNewRoomName("");
			setIsAddingNew(false);
		}
	};

	const handleSaveEdit = (roomId: string) => {
		if (editValue.trim()) {
			setRooms(
				rooms.map((room) =>
					room.id === roomId ? { ...room, name: editValue.trim() } : room,
				),
			);
		}
		setEditingRoomId(null);
		setEditValue("");
	};

	const handleCancelAdd = () => {
		setIsAddingNew(false);
		setNewRoomName("");
	};

	const handleCancelEdit = () => {
		setEditingRoomId(null);
		setEditValue("");
	};

	const handleDeleteRoom = (roomId: string) => {
		setRooms(rooms.filter((room) => room.id !== roomId));
	};

	const startEdit = (room: Room) => {
		setEditingRoomId(room.id);
		setEditValue(
			room.isDefault ? tDefault(room.name as DefaultRoomKey) : room.name,
		);
	};

	const handleStartAdd = () => {
		setIsAddingNew(true);
		setNewRoomName("");
	};

	const getRoomDisplayName = (room: Room) => {
		return room.isDefault ? tDefault(room.name as DefaultRoomKey) : room.name;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
						<HomeIcon className="text-orange-500" size={16} />
					</div>
					<h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
				</div>

				{!isAddingNew && (
					<button
						type="button"
						className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium"
						onClick={handleStartAdd}
					>
						<PlusIcon size={16} />
						{t("addRoom")}
					</button>
				)}
			</div>

			<div className="space-y-3">
				{isAddingNew && (
					<div className="flex items-center gap-2">
						<Input
							ref={inputRef}
							value={newRoomName}
							onChange={(e) => setNewRoomName(e.target.value)}
							placeholder={t("enterRoomName")}
							className="flex-1 border-2 border-orange-500 focus-visible:border-orange-500 focus-visible:ring-0 focus:border-orange-500 focus:ring-0 focus:outline-none"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleAddRoom();
								if (e.key === "Escape") handleCancelAdd();
							}}
						/>
						<button
							type="button"
							onClick={handleAddRoom}
							className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 font-medium"
						>
							{t("add")}
						</button>
						<button
							type="button"
							onClick={handleCancelAdd}
							className="text-gray-500 px-4 py-2 rounded-md hover:bg-gray-100 font-medium"
						>
							{tCommon("cancel")}
						</button>
					</div>
				)}

				<div className="bg-white rounded-lg overflow-hidden border border-gray-200">
					{rooms.map((room, index) => {
						const isEditing = editingRoomId === room.id;
						return (
							<div
								key={room.id}
								className={`${
									index < rooms.length - 1 ? "border-b border-gray-200" : ""
								}`}
							>
								{isEditing ? (
									<div className="flex items-center p-2">
										<Input
											ref={inputRef}
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											className="flex-1 border-2 border-orange-500 focus-visible:border-orange-500 focus-visible:ring-0 focus:border-orange-500 focus:ring-0 focus:outline-none"
											onKeyDown={(e) => {
												if (e.key === "Enter") handleSaveEdit(room.id);
												if (e.key === "Escape") handleCancelEdit();
											}}
										/>
										<button
											type="button"
											onClick={() => handleSaveEdit(room.id)}
											className="ml-2 p-1.5 text-green-600 hover:bg-green-50 rounded"
										>
											<CheckIcon size={20} />
										</button>
										<button
											type="button"
											onClick={handleCancelEdit}
											className="ml-1 p-1.5 text-gray-400 hover:bg-gray-100 rounded"
										>
											<XIcon size={20} />
										</button>
									</div>
								) : (
									<div className="flex items-center justify-between px-4 py-3">
										<span className="font-medium text-gray-700">
											{getRoomDisplayName(room)}
										</span>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => startEdit(room)}
												className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
											>
												<PencilIcon size={16} />
											</button>
											<button
												type="button"
												onClick={() => handleDeleteRoom(room.id)}
												className="p-1 text-gray-400 hover:text-red-500 transition-colors"
											>
												<TrashIcon size={16} />
											</button>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
