const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RequestPasswordResetRequest {
  email: string;
}

export interface VerifyPasswordResetRequest {
  email: string;
  otp: string;
}

export interface VerifyPasswordResetResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export async function requestPasswordReset(request: RequestPasswordResetRequest) {
  const res = await fetch(`${BASE_URL}/password-resets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to send reset code");
  }
}

export async function verifyPasswordReset(
  request: VerifyPasswordResetRequest
): Promise<VerifyPasswordResetResponse> {
  const res = await fetch(`${BASE_URL}/password-resets/verify`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "OTP verification failed");
  }

  return res.json() as Promise<VerifyPasswordResetResponse>;
}

export async function resetPassword(request: ResetPasswordRequest) {
  const res = await fetch(`${BASE_URL}/password-resets`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to reset password");
  }
}
