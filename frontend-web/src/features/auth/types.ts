export interface UserProfile {
  id: string,
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isInitializing: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  loginSuccess: (token: string) => Promise<void>;
  fetchUserProfile: () => Promise<UserProfile | null>;
  clearState: () => void;
}
