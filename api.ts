// Base URL for backend (without trailing `/api`).
// Can be set via Vite env: VITE_API_BASE_URL
export const API_BASE_URL =
	(import.meta as any)?.env?.VITE_API_BASE_URL || "https://fastep-work.onrender.com";

// Admin secret from Vite environment variable
// CRITICAL: Must be set via VITE_ADMIN_SECRET in Render Frontend environment
export const ADMIN_SECRET = (import.meta as any)?.env?.VITE_ADMIN_SECRET || '';

// DEBUG: Log environment at module load time
console.log(
	"%c[api.ts] Environment Loading Debug (Module Load Time)",
	"color: #ff9800; font-weight: bold; font-size: 13px;",
);
console.log("%c  API_BASE_URL:", "color: #00bcd4;", API_BASE_URL);
console.log("%c  ADMIN_SECRET loaded:", "color: #00bcd4;", ADMIN_SECRET ? "YES (***set***)" : "NO (empty string)");
console.log(
	"%c  Raw import.meta.env.VITE_ADMIN_SECRET:",
	"color: #00bcd4;",
	(import.meta as any)?.env?.VITE_ADMIN_SECRET || "(undefined)"
);

// One-time warning if ADMIN_SECRET not set
if (!ADMIN_SECRET) {
	console.warn(
		'%c⚠️ VITE_ADMIN_SECRET not set!',
		'color: #ff6b6b; font-weight: bold; font-size: 14px;'
	);
	console.warn(
		'%cAdmin endpoints will return 401 Unauthorized. Set VITE_ADMIN_SECRET in Render Frontend environment and redeploy with "Clear build cache".',
		'color: #ff6b6b; font-size: 12px;'
	);
} else {
	console.log(
		'%c✅ VITE_ADMIN_SECRET loaded successfully',
		'color: #51cf66; font-weight: bold; font-size: 14px;'
	);
}

// Helper function to add admin secret to headers
export function adminHeaders(extra: Record<string, string> = {}) {
	return {
		...extra,
		"x-admin-secret": ADMIN_SECRET
	};
}

// Centralized API client
export async function apiFetch(path: string, options: RequestInit = {}) {
	const url = API_BASE_URL + path;
	console.log("API REQUEST:", url);
	
	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(options?.headers || {})
		}
	});
	
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(errorText || `HTTP ${res.status}`);
	}
	
	return res.json();
}

export default API_BASE_URL;
