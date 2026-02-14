// Base URL for backend (without trailing `/api`).
// Can be set via Vite env: VITE_API_BASE_URL
export const API_BASE_URL =
	(import.meta as any)?.env?.VITE_API_BASE_URL || "https://fastep-work.onrender.com";

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
