"use client";

import type React from "react";
import { createContext, useContext, useRef } from "react";

interface TaskContextType {
	triggerRefetch: () => void;
	setRefetchHandler: (handler: (() => void) | null) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
	const refetchHandlerRef = useRef<(() => void) | null>(null);

	const triggerRefetch = () => {
		if (refetchHandlerRef.current) {
			refetchHandlerRef.current();
		}
	};

	const setRefetchHandler = (handler: (() => void) | null) => {
		refetchHandlerRef.current = handler;
	};

	return (
		<TaskContext.Provider value={{ triggerRefetch, setRefetchHandler }}>
			{children}
		</TaskContext.Provider>
	);
}

export function useTaskContext() {
	const context = useContext(TaskContext);
	if (!context) {
		throw new Error("useTaskContext must be used within TaskProvider");
	}
	return context;
}
