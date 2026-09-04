import { useState, useEffect, useCallback } from "react";
import { getMe, updateProfile, ValidationError } from "../lib/api";
import type { AuthUser } from "../lib/api";
import { useAuth } from "./useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UseProfileSettingsResult {
  user: AuthUser | null;
  isLoading: boolean;
  loadError: string | null;
  profileForm: ProfileForm;
  setProfileForm: (v: ProfileForm) => void;
  profileStatus: Status;
  profileError: string | null;
  submitProfile: () => Promise<void>;
  passwordForm: PasswordForm;
  setPasswordForm: (v: PasswordForm) => void;
  passwordStatus: Status;
  passwordError: string | null;
  submitPassword: () => Promise<void>;
}

const EMPTY_PASSWORD_FORM: PasswordForm = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileSettings(): UseProfileSettingsResult {
  const { updateUser } = useAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
  });
  const [profileStatus, setProfileStatus] = useState<Status>("idle");
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordStatus, setPasswordStatus] = useState<Status>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    getMe()
      .then((userData) => {
        if (cancelled) return;
        setUser(userData);
        setProfileForm({ name: userData.name, email: userData.email });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Erro ao carregar dados do perfil."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Submit profile (name + email)
  const submitProfile = useCallback(async () => {
    setProfileStatus("loading");
    setProfileError(null);

    try {
      const updatedUser = await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      });
      setUser(updatedUser);
      setProfileForm({ name: updatedUser.name, email: updatedUser.email });
      updateUser(updatedUser);
      setProfileStatus("success");
    } catch (err) {
      setProfileStatus("error");
      if (err instanceof ValidationError) {
        const firstKey = Object.keys(err.errors)[0];
        const firstMessage = firstKey ? err.errors[firstKey][0] : "Erro de validação.";
        setProfileError(firstMessage ?? "Erro de validação.");
      } else {
        setProfileError(
          err instanceof Error ? err.message : "Erro ao atualizar perfil."
        );
      }
    }
  }, [profileForm, updateUser]);

  // Submit password change
  const submitPassword = useCallback(async () => {
    setPasswordStatus("loading");
    setPasswordError(null);

    try {
      await updateProfile({
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      });
      setPasswordStatus("success");
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (err) {
      setPasswordStatus("error");
      if (err instanceof ValidationError) {
        const firstKey = Object.keys(err.errors)[0];
        const firstMessage = firstKey ? err.errors[firstKey][0] : "Erro de validação.";
        setPasswordError(firstMessage ?? "Erro de validação.");
      } else {
        setPasswordError(
          err instanceof Error ? err.message : "Erro ao alterar senha."
        );
      }
    }
  }, [passwordForm]);

  return {
    user,
    isLoading,
    loadError,
    profileForm,
    setProfileForm,
    profileStatus,
    profileError,
    submitProfile,
    passwordForm,
    setPasswordForm,
    passwordStatus,
    passwordError,
    submitPassword,
  };
}
