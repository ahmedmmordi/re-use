const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface EmailConfirmationRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export async function sendEmailConfirmation(request: EmailConfirmationRequest) {
  const res = await fetch(`${BASE_URL}/email-confirmations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to send OTP");
  }
}

export async function verifyOtp(request: VerifyOtpRequest) {
  const res = await fetch(`${BASE_URL}/email-confirmations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "OTP verification failed");
  }
}
