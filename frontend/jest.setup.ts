import "@testing-library/jest-dom";

// Set up environment variables for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
process.env.NEXT_PUBLIC_TEST_USER_ID = "test-user-123";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
		back: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	})),
	usePathname: jest.fn(() => "/"),
	useSearchParams: jest.fn(() => new URLSearchParams()),
	redirect: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
	getSession: jest.fn(() => null),
	useSession: jest.fn(() => ({
		data: null,
		status: "unauthenticated",
	})),
	signIn: jest.fn(),
	signOut: jest.fn(),
	SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
