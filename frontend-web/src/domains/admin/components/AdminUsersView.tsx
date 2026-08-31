import { useState, useEffect } from "react";
import { api } from "@/core";


import { Loader2, RefreshCw, Search, Shield, Lock, Unlock, CheckCircle, AlertCircle, UserPlus, Plus, Trash2, Edit3, KeyRound } from "lucide-react";
import { ConfirmModal } from "@/shared";

export interface UserItem {
	id: number;
	email: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	avatarUrl?: string;
	roles: string[];
	isLockedOut: boolean;
	isActive?: boolean;
}

export interface RoleItem {
	id: number;
	name: string;
	userCount?: number;
}

export function AdminUsersView() {
	const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

	// Users State
	const [users, setUsers] = useState<UserItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	// Roles State
	const [roles, setRoles] = useState<RoleItem[]>([]);
	const [rolesLoading, setRolesLoading] = useState(false);

	// Action modals state
	const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
	const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
	const [selectedRole, setSelectedRole] = useState("User");
	
	// Create User Modal state
	const [showCreateUserModal, setShowCreateUserModal] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newFirstName, setNewFirstName] = useState("");
	const [newLastName, setNewLastName] = useState("");
	const [newRole, setNewRole] = useState("User");

	// Create / Edit Role Modal State
	const [showRoleEditModal, setShowRoleEditModal] = useState(false);
	const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
	const [roleNameInput, setRoleNameInput] = useState("");

	// Unified Confirm Modal state for lock/unlock or delete operations
	const [confirmState, setConfirmState] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		variant: "warning" | "danger" | "info" | "success";
		onConfirm: () => Promise<void>;
	}>({
		isOpen: false,
		title: "",
		message: "",
		variant: "warning",
		onConfirm: async () => {},
	});

	const [actionLoading, setActionLoading] = useState(false);
	const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

	// Fetch Users
	const fetchUsers = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
			});
			if (searchQuery.trim()) {
				params.append("search", searchQuery.trim());
			}

			const response = await api.get(`/users?${params.toString()}`).catch(() => null);
			if (response?.data) {
				const items = response.data?.items || response.data?.value?.items || [];
				const total = response.data?.totalCount ?? items.length;
				setUsers(items);
				setTotalCount(total);
			} else {
				setUsers([
					{ id: 1, email: "admin@system.com", firstName: "System", lastName: "Admin", roles: ["Admin"], isLockedOut: false, isActive: true },
					{ id: 2, email: "manager@system.com", firstName: "Trần", lastName: "Quản Lý", roles: ["Manager"], isLockedOut: false, isActive: true },
					{ id: 3, email: "staff@system.com", firstName: "Lê", lastName: "Nhân Viên", roles: ["Staff"], isLockedOut: false, isActive: true },
					{ id: 4, email: "user@gmail.com", firstName: "Nguyễn", lastName: "Văn A", roles: ["User"], isLockedOut: false, isActive: true },
				]);
				setTotalCount(4);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách người dùng", err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch Roles
	const fetchRoles = async () => {
		try {
			setRolesLoading(true);
			const response = await api.get("/roles").catch(() => null);
			if (response?.data && Array.isArray(response.data)) {
				setRoles(response.data);
			} else {
				setRoles([
					{ id: 1, name: "Admin", userCount: 1 },
					{ id: 2, name: "Manager", userCount: 1 },
					{ id: 3, name: "Staff", userCount: 1 },
					{ id: 4, name: "User", userCount: 1 },
				]);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách vai trò", err);
		} finally {
			setRolesLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "users") {
			fetchUsers();
		} else {
			fetchRoles();
		}
	}, [page, activeTab]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchUsers();
	};

	// Create User Handler
	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newEmail.trim() || !newPassword.trim()) {
			setAlertMsg({ type: "error", text: "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
			return;
		}

		setActionLoading(true);
		try {
			await api.post("/users", {
				email: newEmail.trim(),
				password: newPassword,
				firstName: newFirstName.trim() || undefined,
				lastName: newLastName.trim() || undefined,
				role: newRole,
			});
			setAlertMsg({ type: "success", text: `Đã tạo tài khoản ${newEmail} thành công với quyền '${newRole}'` });
			setShowCreateUserModal(false);
			// Reset form
			setNewEmail("");
			setNewPassword("");
			setNewFirstName("");
			setNewLastName("");
			setNewRole("User");
			fetchUsers();
		} catch (err: any) {
			setAlertMsg({ type: "error", text: err.response?.data?.message || err.response?.data || "Tạo tài khoản thất bại!" });
		} finally {
			setActionLoading(false);
		}
	};

	// Assign Role Handler
	const handleAssignRole = async () => {
		if (!selectedUser) return;
		setActionLoading(true);
		try {
			await api.put(`/users/${selectedUser.id}/roles`, { roleName: selectedRole });
			setAlertMsg({ type: "success", text: `Đã cập nhật vai trò '${selectedRole}' cho ${selectedUser.email}` });
			setShowAssignRoleModal(false);
			fetchUsers();
		} catch (err: any) {
			setAlertMsg({ type: "error", text: err.response?.data?.message || err.response?.data || "Gán vai trò thất bại!" });
		} finally {
			setActionLoading(false);
		}
	};

	// Unified Lock/Unlock Trigger
	const handleToggleLock = (user: UserItem) => {
		const isLocking = user.isActive !== false && !user.isLockedOut;
		const actionText = isLocking ? "khoá/vô hiệu hóa" : "mở khoá/kích hoạt";
		
		setConfirmState({
			isOpen: true,
			title: isLocking ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản",
			message: `Bạn có chắc chắn muốn ${actionText} tài khoản "${user.email}"? ${isLocking ? "Người dùng sẽ bị cấm đăng nhập vào hệ thống." : "Người dùng sẽ khôi phục lại quyền truy cập bình thường."}`,
			variant: isLocking ? "danger" : "info",
			onConfirm: async () => {
				setActionLoading(true);
				try {
					const endpoint = isLocking ? `/users/${user.id}/lock` : `/users/${user.id}/unlock`;
					await api.post(endpoint);
					setAlertMsg({ type: "success", text: `Đã ${actionText} tài khoản thành công!` });
					fetchUsers();
				} catch (err: any) {
					setAlertMsg({ type: "error", text: err.response?.data?.message || err.response?.data || "Thao tác thất bại!" });
				} finally {
					setActionLoading(false);
					setConfirmState((prev) => ({ ...prev, isOpen: false }));
				}
			},
		});
	};

	// Create or Edit Role Handler
	const handleSaveRole = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roleNameInput.trim()) return;

		setActionLoading(true);
		try {
			if (editingRole) {
				await api.put(`/roles/${editingRole.id}`, { newRoleName: roleNameInput.trim() });
				setAlertMsg({ type: "success", text: `Cập nhật vai trò '${roleNameInput.trim()}' thành công!` });
			} else {
				await api.post("/roles", { roleName: roleNameInput.trim() });
				setAlertMsg({ type: "success", text: `Đã tạo vai trò '${roleNameInput.trim()}' thành công!` });
			}
			setShowRoleEditModal(false);
			setRoleNameInput("");
			setEditingRole(null);
			fetchRoles();
		} catch (err: any) {
			setAlertMsg({ type: "error", text: err.response?.data?.message || err.response?.data || "Thao tác vai trò thất bại!" });
		} finally {
			setActionLoading(false);
		}
	};

	// Delete Role Trigger
	const handleDeleteRole = (role: RoleItem) => {
		setConfirmState({
			isOpen: true,
			title: "Xác nhận xóa vai trò",
			message: `Bạn có chắc chắn muốn xóa vai trò "${role.name}" khỏi hệ thống?`,
			variant: "danger",
			onConfirm: async () => {
				setActionLoading(true);
				try {
					await api.delete(`/roles/${role.id}`);
					setAlertMsg({ type: "success", text: `Đã xóa vai trò '${role.name}' thành công!` });
					fetchRoles();
				} catch (err: any) {
					setAlertMsg({ type: "error", text: err.response?.data?.message || err.response?.data || "Xóa vai trò thất bại!" });
				} finally {
					setActionLoading(false);
					setConfirmState((prev) => ({ ...prev, isOpen: false }));
				}
			},
		});
	};

	// Helper role badge color mapping: Admin, Manager, User, Staff
	const renderRoleBadge = (roleName: string) => {
		switch (roleName) {
			case "Admin":
				return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
			case "Manager":
				return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">Manager</span>;
			case "Staff":
				return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">Staff</span>;
			case "User":
			default:
				return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">User</span>;
		}
	};

	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header Navigation & Tabs */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý Tài khoản & Phân quyền</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các tài khoản thành viên, quản lý, nhân viên và thiết lập vai trò hệ thống</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setActiveTab("users")}
						className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${activeTab === "users" ? "bg-brand-dark text-white shadow-xs" : "bg-brand-light-soft text-brand-muted hover:text-brand-dark"}`}
					>
						Người dùng
					</button>
					<button
						onClick={() => setActiveTab("roles")}
						className={`px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${activeTab === "roles" ? "bg-brand-dark text-white shadow-xs" : "bg-brand-light-soft text-brand-muted hover:text-brand-dark"}`}
					>
						Quản lý Roles
					</button>
				</div>
			</div>

			{/* Sub Header Toolbar */}
			{activeTab === "users" && (
				<div className="flex flex-col sm:flex-row justify-between items-center gap-2">
					<div className="flex items-center gap-2 w-full sm:w-auto flex-1">
						<form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
							<input
								type="text"
								placeholder="Tìm kiếm email, họ tên..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark bg-white"
							/>
							<Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
						</form>

						{/* Center Button: Tạo tài khoản */}
						<button
							type="button"
							onClick={() => setShowCreateUserModal(true)}
							className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-white font-bold text-xs rounded flex items-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer border-none"
						>
							<UserPlus className="w-3.5 h-3.5" /> Tạo tài khoản
						</button>

						<button
							onClick={fetchUsers}
							title="Làm mới"
							className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border border-brand-border bg-white shrink-0"
						>
							<RefreshCw className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{activeTab === "roles" && (
				<div className="flex justify-between items-center">
					<p className="text-xs font-bold text-brand-muted">Các vai trò định nghĩa mức độ phân quyền trong hệ thống</p>
					<button
						type="button"
						onClick={() => {
							setEditingRole(null);
							setRoleNameInput("");
							setShowRoleEditModal(true);
						}}
						className="px-3 py-1.5 bg-brand-dark text-white font-extrabold text-xs rounded-md flex items-center gap-1.5 shrink-0 shadow-xs hover:bg-brand-primary hover:text-brand-dark transition-all cursor-pointer"
					>
						<Plus className="w-3.5 h-3.5" /> Thêm vai trò mới
					</button>
				</div>
			)}

			{/* Alert notification */}
			{alertMsg && (
				<div className={`p-3 rounded-md text-xs font-bold flex items-center justify-between ${alertMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
					<div className="flex items-center gap-2">
						{alertMsg.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
						<span>{alertMsg.text}</span>
					</div>
					<button onClick={() => setAlertMsg(null)} className="text-xs font-black cursor-pointer px-1.5 py-0.5 hover:bg-black/5 rounded-md">✕</button>
				</div>
			)}

			{/* TAB 1: USERS LIST TABLE */}
			{activeTab === "users" && (
				<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
					{loading ? (
						<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
							<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách thành viên...
						</div>
					) : users.length === 0 ? (
						<div className="text-center py-16 text-brand-muted font-bold text-xs">Không tìm thấy người dùng nào.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs text-left border-collapse">
								<thead>
									<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
										<th className="p-3 w-1/4">Thành viên</th>
										<th className="p-3 w-1/3">Địa chỉ Email</th>
										<th className="p-3 w-1/5">Vai trò hệ thống</th>
										<th className="p-3 text-center w-28">Trạng thái</th>
										<th className="p-3 text-right w-36">Hành động</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border">
									{users.map((u) => {
										const displayName = [u.lastName, u.firstName].filter(Boolean).join(" ") || u.fullName || u.email.split("@")[0];
										return (
											<tr key={u.id} className="hover:bg-brand-light-soft/10 transition-colors">
												<td className="p-3">
													<div className="flex items-center gap-2.5">
														<img
															src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`}
															alt={displayName}
															className="w-8 h-8 rounded-md border border-brand-border object-cover bg-brand-light-soft"
														/>
														<div>
															<p className="font-extrabold text-brand-dark text-xs">{displayName}</p>
															<p className="text-[10px] text-brand-muted font-mono">ID: #{u.id}</p>
														</div>
													</div>
												</td>
												<td className="p-3 font-mono font-bold text-brand-dark">{u.email}</td>
												<td className="p-3">
													<div className="flex flex-wrap gap-1">
														{(u.roles || []).length > 0 ? (
															u.roles.map((r, i) => (
																<span key={i}>{renderRoleBadge(r)}</span>
															))
														) : (
															renderRoleBadge("User")
														)}
													</div>
												</td>
												<td className="p-3 text-center">
													{u.isActive === false || u.isLockedOut ? (
														<span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[9px] font-extrabold uppercase">Đã khóa</span>
													) : (
														<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-extrabold uppercase">Hoạt động</span>
													)}
												</td>
												<td className="p-3 text-right">
													<div className="flex items-center justify-end gap-1.5">
														<button
															type="button"
															onClick={() => {
																setSelectedUser(u);
																setSelectedRole(u.roles?.[0] || "User");
																setShowAssignRoleModal(true);
															}}
															title="Gán vai trò"
															className="px-2 py-1 bg-brand-light-soft hover:bg-brand-primary/10 text-brand-dark text-[10px] font-extrabold rounded-md flex items-center gap-1 transition-colors cursor-pointer border border-brand-border"
														>
															<Shield className="w-3 h-3 text-brand-primary" /> Role
														</button>
														<button
															type="button"
															onClick={() => handleToggleLock(u)}
															title={u.isActive === false || u.isLockedOut ? "Mở khóa tài khoản" : "Khóa tài khoản"}
															className={`p-1.5 rounded-md transition-colors cursor-pointer border ${u.isActive === false || u.isLockedOut ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"}`}
														>
															{u.isActive === false || u.isLockedOut ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination Footer */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between p-3 border-t border-brand-border text-xs text-brand-muted font-bold">
							<span>Hiển thị trang {page} / {totalPages} (Tổng {totalCount} thành viên)</span>
							<div className="flex items-center gap-1">
								<button
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}
									className="px-2.5 py-1 bg-white border border-brand-border rounded-md hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
								>
									&lt; Trước
								</button>
								<button
									disabled={page >= totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="px-2.5 py-1 bg-white border border-brand-border rounded-md hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
								>
									Sau &gt;
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* TAB 2: ROLES MANAGEMENT TABLE */}
			{activeTab === "roles" && (
				<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
					{rolesLoading ? (
						<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
							<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách vai trò...
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs text-left border-collapse">
								<thead>
									<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
										<th className="p-3 w-16">ID</th>
										<th className="p-3">Tên Vai trò</th>
										<th className="p-3">Huy hiệu hiển thị</th>
										<th className="p-3 text-center">Số lượng tài khoản</th>
										<th className="p-3 text-right w-28">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border">
									{roles.map((r) => (
										<tr key={r.id} className="hover:bg-brand-light-soft/10 transition-colors">
											<td className="p-3 font-mono font-bold text-brand-muted">#{r.id}</td>
											<td className="p-3 font-extrabold text-brand-dark">{r.name}</td>
											<td className="p-3">{renderRoleBadge(r.name)}</td>
											<td className="p-3 text-center font-bold font-mono text-brand-dark">{r.userCount ?? 0} người dùng</td>
											<td className="p-3 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<button
														type="button"
														onClick={() => {
															setEditingRole(r);
															setRoleNameInput(r.name);
															setShowRoleEditModal(true);
														}}
														className="p-1.5 text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft rounded-md cursor-pointer transition-colors border border-brand-border bg-white"
														title="Sửa tên vai trò"
													>
														<Edit3 className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														disabled={r.name === "Admin" || r.name === "User"}
														onClick={() => handleDeleteRole(r)}
														className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors border border-rose-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed"
														title="Xóa vai trò"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* MODAL 1: Tạo tài khoản người dùng cơ bản */}
			{showCreateUserModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-md w-full max-w-md p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-2.5 flex items-center justify-between">
							<div>
								<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
									<UserPlus className="w-4 h-4 text-brand-primary" /> Tạo tài khoản mới
								</h3>
								<p className="text-[10px] text-brand-muted font-bold mt-0.5">Khởi tạo thông tin đăng nhập và cấp vai trò hệ thống</p>
							</div>
							<button onClick={() => setShowCreateUserModal(false)} className="text-brand-muted hover:text-brand-dark font-bold text-xs cursor-pointer">✕</button>
						</div>

						<form onSubmit={handleCreateUser} className="space-y-3 text-xs">
							<div>
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Email đăng nhập *</label>
								<input
									type="email"
									required
									placeholder="nhanvien@system.com"
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Mật khẩu khởi tạo *</label>
								<div className="relative">
									<input
										type="password"
										required
										placeholder="Mật khẩu tối thiểu 6 ký tự"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
									/>
									<KeyRound className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-brand-muted" />
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Họ</label>
									<input
										type="text"
										placeholder="Nguyễn"
										value={newLastName}
										onChange={(e) => setNewLastName(e.target.value)}
										className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
									/>
								</div>
								<div>
									<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Tên</label>
									<input
										type="text"
										placeholder="Văn A"
										value={newFirstName}
										onChange={(e) => setNewFirstName(e.target.value)}
										className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Gán Vai trò ban đầu *</label>
								<select
									value={newRole}
									onChange={(e) => setNewRole(e.target.value)}
									className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer"
								>
									<option value="User">User (Người dùng hệ thống)</option>
									<option value="Staff">Staff (Nhân viên)</option>
									<option value="Manager">Manager (Quản lý)</option>
									<option value="Admin">Admin (Quản trị viên tối cao)</option>
								</select>
							</div>

							<div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border/60">
								<button
									type="button"
									onClick={() => setShowCreateUserModal(false)}
									className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={actionLoading}
									className="px-4 py-1.5 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-md font-black text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
								>
									{actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Tạo tài khoản
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL 2: Gán vai trò (Assign Role Modal) */}
			{showAssignRoleModal && selectedUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-md w-full max-w-sm p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-2.5">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">Phân quyền vai trò tài khoản</h3>
							<p className="text-[10px] text-brand-muted font-bold mt-0.5">{selectedUser.email}</p>
						</div>

						<div className="space-y-2 text-xs">
							<label className="block text-[10px] font-extrabold text-brand-muted uppercase">Chọn vai trò hệ thống mới</label>
							<select
								value={selectedRole}
								onChange={(e) => setSelectedRole(e.target.value)}
								className="w-full px-3 py-2 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer"
							>
								<option value="User">User (Khách hàng / Thành viên)</option>
								<option value="Staff">Staff (Nhân viên vận hành)</option>
								<option value="Manager">Manager (Quản lý cửa hàng / hệ thống)</option>
								<option value="Admin">Admin (Quản trị viên hệ thống)</option>
							</select>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/60">
							<button
								type="button"
								onClick={() => setShowAssignRoleModal(false)}
								className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer"
							>
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={handleAssignRole}
								disabled={actionLoading}
								className="px-4 py-1.5 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-md font-black text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
							>
								{actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Cập nhật vai trò
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL 3: Thêm / Sửa Role Modal */}
			{showRoleEditModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-md w-full max-w-sm p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-2.5">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">
								{editingRole ? "Sửa tên vai trò" : "Tạo vai trò mới"}
							</h3>
						</div>

						<form onSubmit={handleSaveRole} className="space-y-3 text-xs">
							<div>
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase mb-1">Tên vai trò (Role Name) *</label>
								<input
									type="text"
									required
									placeholder="VD: Moderator, Supervisor..."
									value={roleNameInput}
									onChange={(e) => setRoleNameInput(e.target.value)}
									className="w-full px-3 py-1.5 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
								/>
							</div>

							<div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border/60">
								<button
									type="button"
									onClick={() => setShowRoleEditModal(false)}
									className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={actionLoading}
									className="px-4 py-1.5 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-md font-black text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
								>
									{actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Lưu vai trò
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL 4: UNIFIED CONFIRM MODAL (Thống nhất cho cảnh báo / khóa / xóa) */}
			<ConfirmModal
				isOpen={confirmState.isOpen}
				title={confirmState.title}
				message={confirmState.message}
				variant={confirmState.variant}
				isConfirming={actionLoading}
				onConfirm={confirmState.onConfirm}
				onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
			/>
		</div>
	);
}

