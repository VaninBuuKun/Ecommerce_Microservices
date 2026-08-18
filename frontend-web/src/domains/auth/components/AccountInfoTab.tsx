import { useState, useEffect, useRef } from "react";
import { Image, Loader2, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../api/authApi";

interface AccountInfoTabProps {
	user: any;
	setUser: (user: any) => void;
}

export function AccountInfoTab({ user, setUser }: AccountInfoTabProps) {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [gender, setGender] = useState<string>("");
	const [avatarUrl, setAvatarUrl] = useState("");

	const [birthDay, setBirthDay] = useState("");
	const [birthMonth, setBirthMonth] = useState("");
	const [birthYear, setBirthYear] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (user) {
			setFirstName(user.firstName || "");
			setLastName(user.lastName || "");
			
			if (user.gender) {
				const g = user.gender.toLowerCase();
				if (g === "male" || g === "nam") setGender("Male");
				else if (g === "female" || g === "nữ" || g === "nu") setGender("Female");
				else if (g === "other" || g === "khác" || g === "khac") setGender("Other");
				else setGender("");
			} else {
				setGender("");
			}

			setAvatarUrl(user.avatarUrl || "");

			if (user.birthDate) {
				const dateObj = new Date(user.birthDate);
				if (!isNaN(dateObj.getTime())) {
					setBirthDay(String(dateObj.getDate()));
					setBirthMonth(String(dateObj.getMonth() + 1));
					setBirthYear(String(dateObj.getFullYear()));
				} else {
					setBirthDay("");
					setBirthMonth("");
					setBirthYear("");
				}
			} else {
				setBirthDay("");
				setBirthMonth("");
				setBirthYear("");
			}
		}
	}, [user]);

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUpdating(true);

		let birthDateString: string | undefined = undefined;
		if (birthYear && birthMonth && birthDay) {
			birthDateString = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}T00:00:00Z`;
		}

		try {
			await authService.updateProfile({
				firstName,
				lastName,
				avatarUrl,
				gender: gender || undefined,
				birthDate: birthDateString,
			});
			toast.success("Cập nhật hồ sơ cá nhân thành công!");

			if (user) {
				setUser({
					...user,
					firstName,
					lastName,
					avatarUrl,
					gender: gender || null,
					birthDate: birthDateString || null,
				});
			}
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Lỗi khi cập nhật hồ sơ");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Vui lòng chọn tệp hình ảnh hợp lệ!");
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result as string;
			if (result) {
				setAvatarUrl(result);
				toast.info("Đã chọn ảnh đại diện mới. Nhấn 'Lưu thay đổi' để hoàn tất.");
			}
		};
		reader.readAsDataURL(file);
	};

	const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
	const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
	const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

	return (
		<div className="space-y-6 text-left font-sans">
			<input
				type="file"
				ref={fileInputRef}
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>

			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Thông tin cá nhân
				</h2>
				<p className="text-xs text-brand-muted">
					Cập nhật họ tên, ảnh đại diện và các thông tin định danh của bạn.
				</p>
			</div>

			<form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-8 items-start">
				<div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
					<div 
						className="relative group cursor-pointer" 
						onClick={() => fileInputRef.current?.click()}
						title="Bấm để tải ảnh lên từ máy tính"
					>
						<img
							src={avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
							alt="Profile Avatar"
							className="w-28 h-28 rounded-full object-cover border-4 border-brand-light-soft shadow-inner"
						/>
						<div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
							<UploadCloud className="w-6 h-6 text-white" />
						</div>
						<button 
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								fileInputRef.current?.click();
							}}
							className="absolute bottom-0 right-0 p-1.5 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark rounded-full border border-white transition-all shadow cursor-pointer"
							title="Thay đổi ảnh đại diện"
						>
							<Image className="w-3.5 h-3.5" />
						</button>
					</div>
					<span className="text-[10px] text-brand-muted font-bold flex items-center gap-1">
						<Image className="w-3 h-3 text-brand-primary" /> Chọn ảnh từ máy tính
					</span>
				</div>

				<div className="flex-1 w-full space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1">Họ</label>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
								className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white font-bold text-brand-dark"
							/>
						</div>
						<div>
							<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1">Tên</label>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
								className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary bg-white font-bold text-brand-dark"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1.5">Ngày sinh</label>
						<div className="grid grid-cols-3 gap-2">
							<select
								value={birthDay}
								onChange={(e) => setBirthDay(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white font-bold text-brand-dark"
							>
								<option value="">-- Ngày (Chưa chọn) --</option>
								{days.map((d) => (
									<option key={d} value={d}>
										Ngày {d}
									</option>
								))}
							</select>
							<select
								value={birthMonth}
								onChange={(e) => setBirthMonth(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white font-bold text-brand-dark"
							>
								<option value="">-- Tháng (Chưa chọn) --</option>
								{months.map((m) => (
									<option key={m} value={m}>
										Tháng {m}
									</option>
								))}
							</select>
							<select
								value={birthYear}
								onChange={(e) => setBirthYear(e.target.value)}
								className="h-9 px-2 border border-brand-border rounded-lg text-xs focus:outline-none cursor-pointer bg-white font-bold text-brand-dark"
							>
								<option value="">-- Năm (Chưa chọn) --</option>
								{years.map((y) => (
									<option key={y} value={y}>
										Năm {y}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="block text-xs font-extrabold text-brand-muted uppercase mb-1.5">Giới tính</label>
						<div className="flex flex-wrap gap-5 text-xs font-bold text-brand-dark mt-1">
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value=""
									checked={gender === ""}
									onChange={() => setGender("")}
									className="accent-brand-primary cursor-pointer"
								/>
								Chưa chọn
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Male"
									checked={gender === "Male"}
									onChange={() => setGender("Male")}
									className="accent-brand-primary cursor-pointer"
								/>
								Nam (Male)
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Female"
									checked={gender === "Female"}
									onChange={() => setGender("Female")}
									className="accent-brand-primary cursor-pointer"
								/>
								Nữ (Female)
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer">
								<input
									type="radio"
									name="gender"
									value="Other"
									checked={gender === "Other"}
									onChange={() => setGender("Other")}
									className="accent-brand-primary cursor-pointer"
								/>
								Khác (Other)
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
