import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	allowedDevOrigins: ["192.168.1.*"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				port: "",
				pathname: "/storage/v1/object/public/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "54321",
				pathname: "/storage/v1/object/public/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "54321",
				pathname: "/storage/v1/object/public/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/api/images/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "8000",
				pathname: "/api/images/**",
			},
			{
				protocol: "http",
				hostname: "192.168.*.*",
				port: "8000",
				pathname: "/api/images/**",
			},
		],
	},
};

export default withNextIntl(nextConfig);
