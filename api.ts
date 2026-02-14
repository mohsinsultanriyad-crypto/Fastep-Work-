// Base URL for backend (without trailing `/api`).
// Can be set via Vite env: VITE_API_BASE_URL
export const API_BASE_URL =
	(import.meta as any)?.env?.VITE_API_BASE_URL || "https://fastep-work.onrender.com";

export default API_BASE_URL;
