import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5111";
const HUB_URL = `${API_BASE}/hubs/notification`;

// Global connection instance (Singleton) to persist across HMR and route changes
let globalConnection: signalR.HubConnection | null = null;
let startPromise: Promise<signalR.HubConnection | null> | null = null;

function createConnection(): signalR.HubConnection {
	const conn = new signalR.HubConnectionBuilder()
		.withUrl(HUB_URL, {
			accessTokenFactory: () => localStorage.getItem("accessToken") || "",
		})
		.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
		.configureLogging(signalR.LogLevel.Warning)
		.build();

	// Lắng nghe sự kiện ForceLogout khi đổi / reset mật khẩu từ server
	conn.on("ForceLogout", (data?: { reason?: string }) => {
		console.warn("[SignalR] Received ForceLogout event:", data);
		useAuthStore.getState().clearState();
		toast.warn(data?.reason || "Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại.", {
			toastId: "force-logout-toast",
			autoClose: 6000,
		});
		if (window.location.pathname !== "/login") {
			window.location.href = "/login";
		}
	});

	return conn;
}

async function startHubConnection(conn: signalR.HubConnection): Promise<signalR.HubConnection | null> {
	if (conn.state === signalR.HubConnectionState.Connected) {
		return conn;
	}

	if (startPromise) {
		return await startPromise;
	}

	if (conn.state === signalR.HubConnectionState.Connecting || conn.state === signalR.HubConnectionState.Reconnecting) {
		// Đợi trạng thái connecting hoặc reconnecting hoàn tất
		for (let i = 0; i < 30; i++) {
			await new Promise((r) => setTimeout(r, 200));
			if (conn.state === signalR.HubConnectionState.Connected) return conn;
			if (conn.state === signalR.HubConnectionState.Disconnected) break;
		}
		if (conn.state === signalR.HubConnectionState.Connected) return conn;
	}

	if (conn.state === signalR.HubConnectionState.Disconnected) {
		startPromise = (async () => {
			try {
				await conn.start();
				console.log("[SignalR] Connected to Hub successfully");
				return conn;
			} catch (err) {
				console.warn("[SignalR] Connection error:", err);
				return null;
			} finally {
				startPromise = null;
			}
		})();

		return await startPromise;
	}

	return conn.state === signalR.HubConnectionState.Connected ? conn : null;
}

/**
 * Centralized SignalR connection hook.
 * Reuses a single global HubConnection instance across the entire application lifecycle.
 */
export function useSignalR() {
	const [isConnected, setIsConnected] = useState(
		globalConnection?.state === signalR.HubConnectionState.Connected
	);

	useEffect(() => {
		const token = localStorage.getItem("accessToken");
		if (!token) {
			// If no token (logout), clean up the global connection
			stopSignalRConnection();
			setIsConnected(false);
			return;
		}

		// Initialize connection if it doesn't exist
		if (!globalConnection) {
			globalConnection = createConnection();

			globalConnection.onreconnecting(() => {
				console.warn("[SignalR] Reconnecting...");
				setIsConnected(false);
			});

			globalConnection.onreconnected(() => {
				console.log("[SignalR] Reconnected successfully");
				setIsConnected(true);
			});

			globalConnection.onclose(() => {
				console.warn("[SignalR] Connection closed");
				setIsConnected(false);
			});
		}

		const conn = globalConnection;
		startHubConnection(conn).then((c) => {
			if (c && c.state === signalR.HubConnectionState.Connected) {
				setIsConnected(true);
			}
		});

		// Update state in sync with connection changes
		const interval = setInterval(() => {
			setIsConnected(conn.state === signalR.HubConnectionState.Connected);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return { connection: globalConnection, isConnected };
}

export function stopSignalRConnection(): void {
	if (globalConnection) {
		globalConnection.stop().catch(() => {});
		globalConnection = null;
	}
	startPromise = null;
}

export function getSignalRConnection(): signalR.HubConnection | null {
	return globalConnection;
}

export async function ensureSignalRConnected(): Promise<signalR.HubConnection | null> {
	const token = localStorage.getItem("accessToken");
	if (!token) return null;

	if (!globalConnection) {
		globalConnection = createConnection();
	}

	return await startHubConnection(globalConnection);
}


