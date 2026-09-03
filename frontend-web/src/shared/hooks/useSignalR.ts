import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domains/auth";

const HUB_URL = "http://localhost:5111/hubs/notification";

// Global connection instance (Singleton) to persist across HMR and route changes
let globalConnection: signalR.HubConnection | null = null;
let isStarting = false;

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
			if (globalConnection) {
				globalConnection.stop();
				globalConnection = null;
			}
			setIsConnected(false);
			return;
		}

		// Initialize connection if it doesn't exist
		if (!globalConnection) {
			globalConnection = new signalR.HubConnectionBuilder()
				.withUrl(HUB_URL, {
					accessTokenFactory: () => token,
				})
				.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
				.configureLogging(signalR.LogLevel.Warning)
				.build();

			// Lắng nghe sự kiện ForceLogout khi đổi / reset mật khẩu từ server
			globalConnection.on("ForceLogout", (data?: { reason?: string }) => {
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

		// Function to safely start connection
		const startConnection = async () => {
			if (conn.state === signalR.HubConnectionState.Disconnected && !isStarting) {
				isStarting = true;
				try {
					await conn.start();
					console.log("[SignalR] Connected to Hub (Singleton)");
					setIsConnected(true);
				} catch (err) {
					console.error("[SignalR] Connection error:", err);
				} finally {
					isStarting = false;
				}
			} else if (conn.state === signalR.HubConnectionState.Connected) {
				setIsConnected(true);
			}
		};

		startConnection();

		// Update state in sync with connection changes
		const interval = setInterval(() => {
			setIsConnected(conn.state === signalR.HubConnectionState.Connected);
		}, 1000);

		return () => {
			clearInterval(interval);
			// We DO NOT call stop() here to keep the connection persistent across route changes.
			// It will only close if the token is cleared (logout) or the browser tab closes.
		};
	}, []);

	return { connection: globalConnection, isConnected };
}

