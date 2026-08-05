import AppRoutes from "./routes/AppRoutes";
import AppProviders from "./routes/AppProviders";
import AuthProvider from "./routes/AuthProvider";
import { ToastContainer } from "react-toastify";
export default function App() {
	return (
		<AppProviders>
			<AuthProvider>
				<AppRoutes />
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
