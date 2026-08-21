import api from "@/core/api/axiosInstance"
import { useAuthStore } from "../stores/useAuthStore";
import type { Result } from "@/core";

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export const authService = {
  async login(
    payloadOrUsername: LoginPayload | string,
    passwordArg?: string
  ): Promise<Result<{ accessToken: string; refreshToken?: string }>> {
    let username = "";
    let password = "";

    if (typeof payloadOrUsername === "string") {
      username = payloadOrUsername;
      password = passwordArg || "";
    } else {
      username = payloadOrUsername.username || payloadOrUsername.email || "";
      password = payloadOrUsername.password;
    }

    try {
      const response = await api.post("/app-auth/login", {
        username,
        email: username,
        password,
      });

      const data = response.data?.value || response.data;
      const accessToken = data?.accessToken || data;
      const refreshToken = data?.refreshToken;

      if (accessToken) {
        useAuthStore.getState().setAuth(accessToken, refreshToken);
        try {
          const userRes = await api.get("/users/me");
          const userData = userRes.data?.value || userRes.data;
          if (userData) {
            useAuthStore.getState().setUser({
              id: userData.id,
              email: userData.email || "",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email || "Khách hàng",
              avatarUrl: userData.avatarUrl,
              phoneNumber: userData.phoneNumber,
              roles: userData.roles || [],
            });
          }
        } catch (profileErr) {
          console.warn("Lỗi khi tải thông tin user sau login:", profileErr);
        }
      }

      return {
        isSuccess: true,
        value: { accessToken, refreshToken },
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        error: {
          code: "AUTH_FAILED",
          message: err.response?.data?.message || err.response?.data || "Đăng nhập thất bại!",
        },
      };
    }
  },

  async register(
    payloadOrEmail: RegisterPayload | string,
    passwordArg?: string,
    firstNameArg?: string,
    lastNameArg?: string,
    phoneNumberArg?: string
  ): Promise<Result<any>> {
    let email = "";
    let password = "";
    let firstName = "";
    let lastName = "";
    let phoneNumber = "";

    if (typeof payloadOrEmail === "string") {
      email = payloadOrEmail;
      password = passwordArg || "";
      firstName = firstNameArg || "";
      lastName = lastNameArg || "";
      phoneNumber = phoneNumberArg || "";
    } else {
      email = payloadOrEmail.email;
      password = payloadOrEmail.password;
      firstName = payloadOrEmail.firstName;
      lastName = payloadOrEmail.lastName;
      phoneNumber = payloadOrEmail.phoneNumber || "";
    }

    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        otp: "123456",
      });

      return {
        isSuccess: true,
        value: response.data,
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        error: {
          code: "REGISTER_FAILED",
          message: err.response?.data?.message || err.response?.data || "Đăng ký tài khoản thất bại!",
        },
      };
    }
  },

  async refresh(): Promise<string> {
    const response = await api.post("/app-auth/refresh");
    const data = response.data?.value || response.data;
    const accessToken = data?.accessToken || data;
    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
    }
    return accessToken;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/app-auth/logout");
    } catch (error) {
      console.error("Lỗi khi gọi API logout trên server:", error);
    } finally {
      useAuthStore.getState().clearState();
    }
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    nickname?: string;
    gender?: string;
    birthDate?: string;
  }): Promise<any> {
    const response = await api.put("/users/profile", data);
    return response.data;
  },
};

export const authApi = authService;

