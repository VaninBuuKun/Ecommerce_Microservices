import AppRoutes from "./routes/AppRoutes";
import AppProviders from "./routes/AppProviders";
import AuthProvider from "./routes/AuthProvider";
import { ToastContainer } from "react-toastify";
import { AuthRequiredModal } from "@/shared/components";

export default function App() {
	return (
		<AppProviders>
			<AuthProvider>
				<AppRoutes />
				<AuthRequiredModal />
				<ToastContainer
					position="bottom-right"
					autoClose={3000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
				/>
			</AuthProvider>
		</AppProviders>
	);
}
