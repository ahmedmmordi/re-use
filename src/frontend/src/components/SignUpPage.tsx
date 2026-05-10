import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { signUpApi } from "../services/authService";

interface SignUpPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToVerification?: (data: { userName: string; email: string }) => void;
}

export function SignUpPage({ onNavigateToLogin, onNavigateToVerification }: SignUpPageProps) {
  const [formData, setFormData] = useState({
    userName: "",
    fullName: "",
    email: "",
    // phone: '',
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) return;

  // Password validation criteria
  const passwordCriteria = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),_.?":{}|<>]/.test(formData.password),
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    const username = formData.userName.trim();

    if (!username) {
      newErrors.userName = "Username is required";
    } else if (username.length < 3) {
      newErrors.userName = "Username must be at least 3 characters";
    } else if (username.length > 20) {
      newErrors.userName = "Username must be less than 20 characters";
    } else if (!usernameRegex.test(username)) {
      newErrors.userName = "Username can only contain letters, numbers, and underscores";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // // Validate phone
    // const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    // if (!formData.phone.trim()) {
    //   newErrors.phone = 'Phone number is required';
    // } else if (!phoneRegex.test(formData.phone.trim())) {
    //   newErrors.phone = 'Invalid phone number';
    // }

    // Validate password with all criteria
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (
      !passwordCriteria.minLength ||
      !passwordCriteria.hasUpperCase ||
      !passwordCriteria.hasLowerCase ||
      !passwordCriteria.hasNumber ||
      !passwordCriteria.hasSpecialChar
    ) {
      newErrors.password = "Password does not meet all requirements";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms and privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await signUpApi({
        userName: formData.userName.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // After successful signup → go to verification
      onNavigateToVerification?.({
        userName: formData.userName,
        email: res.email, // ← take from backend response
      });
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: "Username or email already exists. Please choose another.", // Default message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7fc] via-[#fef8fb] to-[#f3f0f9] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Logo Section - Prominent */}
      <div className="mb-10 text-center z-10">
        <div className="inline-block bg-gradient-to-r from-[#4B0082]/5 to-[#8B5CF6]/5 px-12 py-6 rounded-3xl backdrop-blur-sm border border-purple-100/50 shadow-lg">
          <h1
            className="text-[64px] font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-[#4B0082] to-[#8B5CF6]"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            ReUse
          </h1>
          <p className="text-gray-600 text-[15px] mt-2 font-medium tracking-wide">
            Join the Sustainable Shopping Movement
          </p>
        </div>
      </div>

      {/* Form Card - Fixed Width, Centered */}
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl shadow-purple-100/50 border border-gray-100/50 p-10 relative z-10 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[14px] font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className={`h-12 text-[15px] ${errors.fullName ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"}`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* UserName */}
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-[14px] font-medium text-gray-700">
              User Name
            </Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your username"
              value={formData.userName}
              onChange={(e) => handleInputChange("userName", e.target.value)}
              className={`h-12 text-[15px] ${errors.userName ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"}`}
            />
            {errors.userName && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.userName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[14px] font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`h-12 text-[15px] ${errors.email ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"}`}
            />
            {errors.email && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Number
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[14px] font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`h-12 text-[15px] ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]'}`}
            />
            {errors.phone && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.phone}
              </p>
            )}
          </div> */}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[14px] font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`h-12 text-[15px] pr-12 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCriteria.minLength ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={passwordCriteria.minLength ? "text-green-700" : "text-gray-600"}
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCriteria.hasUpperCase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={passwordCriteria.hasUpperCase ? "text-green-700" : "text-gray-600"}
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCriteria.hasLowerCase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={passwordCriteria.hasLowerCase ? "text-green-700" : "text-gray-600"}
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCriteria.hasNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={passwordCriteria.hasNumber ? "text-green-700" : "text-gray-600"}
                    >
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordCriteria.hasSpecialChar ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={
                        passwordCriteria.hasSpecialChar ? "text-green-700" : "text-gray-600"
                      }
                    >
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[14px] font-medium text-gray-700">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`h-12 text-[15px] pr-12 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => {
                  setAgreedToTerms(checked as boolean);
                  if (errors.terms) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.terms;
                      return newErrors;
                    });
                  }
                }}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-[14px] text-gray-600 font-normal leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <a href="/terms" className="text-[#4B0082] hover:underline font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/terms" className="text-[#4B0082] hover:underline font-medium">
                  Privacy Policy
                </a>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-[13px] ml-7 flex items-center gap-1">
                <span>⚠</span>
                {errors.terms}
              </p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm text-center mt-2">{errors.general}</p>
          )}
          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white text-[16px] font-semibold py-4 rounded-xl hover:from-[#3d2e7c] hover:to-[#2f2360] hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>

          {/* Footer Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-[14px] text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#4B0082] font-semibold hover:underline"
              >
                Log In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
