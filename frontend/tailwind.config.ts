import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
				mono: ["var(--font-geist-mono)", "monospace"],
				// Add Hebrew font support
				hebrew: [
					"var(--font-noto-sans-hebrew)",
					"system-ui",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"Helvetica Neue",
					"Arial",
					"sans-serif",
				],
			},
		},
	},
	plugins: [
		// RTL support plugin
		({ addUtilities, addVariant }: any) => {
			// Add RTL/LTR variants
			addVariant("rtl", '[dir="rtl"] &');
			addVariant("ltr", '[dir="ltr"] &');

			// Add custom utilities that complement Tailwind's logical properties
			addUtilities({
				// Transform utilities for RTL icon mirroring
				".rtl-mirror": {
					transform: "scaleX(-1)",
				},
				".rtl\\:mirror": {
					'[dir="rtl"] &': {
						transform: "scaleX(-1)",
					},
				},

				// Flex direction utilities for RTL
				".flex-row-reverse-rtl": {
					'[dir="rtl"] &': {
						"flex-direction": "row-reverse",
					},
				},
			});
		},
	],
};

export default config;
