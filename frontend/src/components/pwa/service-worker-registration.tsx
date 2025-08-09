"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					console.log(
						"SW: Service Worker registered successfully",
						registration.scope,
					);

					// Check for updates
					registration.addEventListener("updatefound", () => {
						console.log("SW: New service worker available");
					});
				})
				.catch((error) => {
					console.log("SW: Service Worker registration failed", error);
				});
		} else {
			console.log("SW: Service Workers not supported");
		}
	}, []);

	return null; // This component doesn't render anything
}
