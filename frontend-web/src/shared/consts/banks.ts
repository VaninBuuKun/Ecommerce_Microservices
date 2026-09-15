export interface Bank {
	name: string;
	code: string; // Mã NAPAS / Mã ngân hàng
	logo: string;
}

export const VIETNAM_BANKS: Bank[] = [
	{ name: "Vietcombank", code: "VCB", logo: "https://api.vietqr.io/img/VCB.png" },
	{ name: "Techcombank", code: "TCB", logo: "https://api.vietqr.io/img/TCB.png" },
	{ name: "MB Bank", code: "MB", logo: "https://api.vietqr.io/img/MB.png" },
	{ name: "ACB", code: "ACB", logo: "https://api.vietqr.io/img/ACB.png" },
	{ name: "BIDV", code: "BIDV", logo: "https://api.vietqr.io/img/BIDV.png" },
	{ name: "VietinBank", code: "ICB", logo: "https://api.vietqr.io/img/ICB.png" },
	{ name: "Agribank", code: "VBA", logo: "https://api.vietqr.io/img/VBA.png" },
	{ name: "Sacombank", code: "STB", logo: "https://api.vietqr.io/img/STB.png" },
	{ name: "VPBank", code: "VPB", logo: "https://api.vietqr.io/img/VPB.png" },
	{ name: "TPBank", code: "TPB", logo: "https://api.vietqr.io/img/TPB.png" },
	{ name: "VIB", code: "VIB", logo: "https://api.vietqr.io/img/VIB.png" },
	{ name: "HDBank", code: "HDB", logo: "https://api.vietqr.io/img/HDB.png" }
];