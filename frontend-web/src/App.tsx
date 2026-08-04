import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./features/auth";
import AppProviders from "./routes/AppProviders";
import AuthProvider from "./routes/AuthProvider";

export default function App() {
	return (
		<AppProviders>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</AppProviders>
	);
}
