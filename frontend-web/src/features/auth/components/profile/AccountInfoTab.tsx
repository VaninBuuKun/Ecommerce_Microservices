import React, { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../../service";
import type { UserProfile } from "../../types";

interface AccountInfoTabProps {
	user: UserProfile | null;
	setUser: (user: UserProfile) => void;
}

export function AccountInfoTab({ user, setUser }: AccountInfoTabProps) {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [nickname, setNickname] = useState("");
	const [gender, setGender] = useState("Nam");
	const [avatarUrl, setAvatarUrl] = useState("");

	const [birthDay, setBirthDay] = useState("1");
	const [birthMonth, setBirthMonth] = useState("1");
	const [birthYear, setBirthYear] = useState("2000");
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		if (user) {
			setFirstName(user.firstName || "");
			setLastName(user.lastName || "");
			setNickname(user.nickname || "Vân Ca");
			setGender(user.gender || "Nam");
			setAvatarUrl(user.avatarUrl || "");

			if (user.birthDate) {
				const dateObj = new Date(user.birthDate);
				if (!isNaN(dateObj.getTime())) {
					setBirthDay(String(dateObj.getDate()));
					setBirthMonth(String(dateObj.getMonth() + 1));
					setBirthYear(String(dateObj.getFullYear()));
				}
			}
		}
	}, [user]);

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUpdating(true);

		const birthDateString = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}T00:00:00Z`;

		try {
			await authService.updateProfile({
				firstName,
				lastName,
				avatarUrl,
				nickname,
				gender,
				birthDate: birthDateString,
			});
			toast.success("Cập nhật hồ sơ cá nhân thành công!");
			
			if (user) {
				setUser({
					...user,
					firstName,
					lastName,
					avatarUrl,
					nickname,
					gender,
					birthDate: birthDateString,
				});
			}
		} catch (err: any) {
			toast.error(err?.response?.data || "Lỗi khi cập nhật hồ sơ");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleAvatarUpload = () => {
		const newUrl = prompt("Nhập đường dẫn URL ảnh đại diện mới:", avatarUrl);
		if (newUrl !== null && newUrl.trim()) {
			setAvatarUrl(newUrl.trim());
			toast.info("Đã thay đổi đường dẫn ảnh tạm thời. Nhấn 'Lưu' để cập nhật.");
		}
	};

	const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
	const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
	const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Thông tin cá nhân
				</h2>
				<p className="text-xs text-brand-muted">
					Cập nhật họ tên, ảnh đại diện và các thông tin định danh của bạn.
				</p>
			</div>

			<form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-8 items-start">
				{/* Avatar Edit Column */}
				<div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
					<div className="relative group cursor-pointer" onClick={handleAvatarUpload}>
						<img
							src={avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
							alt="Profile Avatar"
							className="w-28 h-28 rounded-full object-cover border-4 border-brand-light-soft shadow-inner"
						/>
						<div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
							<Camera className="w-6 h-6 text-white" />
						</div>
						<button 
							type="button"
							className="absolute bottom-0 right-0 p-1.5 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark rounded-full border border-white transition-all shadow cursor-pointer"
						>
							<Camera className="w-3.5 h-3.5" />
						</button>
					</div>
					<span className="text-[10px] text-brand-muted font-bold">Bấm vào để đổi avatar</span>
				</div>

				{/* Inputs Details Form */}
				<div className="flex-1 w-full space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1">Họ</label>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
								className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white"
							/>
						</div>
						<div>
							<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1">Tên</label>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
								className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1">Nickname</label>
						<input
							type="text"
							placeholder="Thêm nickname"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white"
						/>
					</div>

					{/* Date of Birth dropdown selector */}
					<div>
						<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1.5">Ngày sinh</label>
						<div className="grid grid-cols-3 gap-2">
							<select
								value={birthDay}
								onChange={(e) => setBirthDay(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white"
							>
								{days.map((d) => (
									<option key={d} value={d}>
										Ngày {d}
									</option>
								))}
							</select>
							<select
								value={birthMonth}
								onChange={(e) => setBirthMonth(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white"
							>
								{months.map((m) => (
									<option key={m} value={m}>
										Tháng {m}
									</option>
								))}
							</select>
							<select
								value={birthYear}
								onChange={(e) => setBirthYear(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white"
							>
								{years.map((y) => (
									<option key={y} value={y}>
										Năm {y}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Gender Radio selects */}
					<div>
						<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1.5">Giới tính</label>
						<div className="flex gap-6 text-xs font-bold text-brand-dark mt-1">
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Nam"
									checked={gender === "Nam"}
									onChange={(e) => setGender(e.target.value)}
									className="accent-brand-primary"
								/>
								Nam
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Nữ"
									checked={gender === "Nữ"}
									onChange={(e) => setGender(e.target.value)}
									className="accent-brand-primary"
								/>
								Nữ
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Khác"
									checked={gender === "Khác"}
									onChange={(e) => setGender(e.target.value)}
									className="accent-brand-primary"
								/>
								Khác
							</label>
						</div>
					</div>

					<div className="pt-4 border-t border-brand-border flex justify-end">
						<button
							type="submit"
							disabled={isUpdating}
							className="px-6 py-2 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
						>
							{isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							Lưu thay đổi
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
