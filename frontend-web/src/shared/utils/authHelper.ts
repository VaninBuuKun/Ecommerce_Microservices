export function parseJwt(token: string): any {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join(""),
		);
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
}

export function isAuthenticated(token?: string | null): boolean {
	const activeToken = token ?? localStorage.getItem("accessToken");
	if (!activeToken) return false;
	const payload = parseJwt(activeToken);
	if (!payload) return false;
	if (payload.exp && typeof payload.exp === "number") {
		const currentTime = Math.floor(Date.now() / 1000);
		if (payload.exp < currentTime) {
			return false;
		}
	}
	return true;
}

export function checkIsAdmin(customToken?: string | null): boolean {
	const token = customToken ?? localStorage.getItem("accessToken");
	if (!token) return false;
	const payload = parseJwt(token);
	if (!payload) return false;
	const roles =
		payload.role ||
		payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
	if (Array.isArray(roles)) {
		return roles.includes("Admin") || roles.includes("admin");
	}
	return (
		roles === "Admin" ||
		roles === "admin" ||
		payload.email === "admin@system.com"
	);
}

