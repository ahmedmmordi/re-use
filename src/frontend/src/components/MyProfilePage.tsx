import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronLeft, Mail, MapPin, Phone, Save, Settings, Trash2, X } from "lucide-react";
import {
  getMyProfile,
  updateMyProfile,
  updateProfileImage,
  deleteProfileImage,
  updateCoverImage,
  deleteCoverImage,
} from "../services/userService";
import type { UpdateUserProfileRequest, UserProfileResponse } from "../services/userService";
import { getMyListings } from "../services/productService";
import type { SellerSummaryResponse } from "../services/productService";
import { AuthError } from "../services/authService";

type FormState = Required<{
  [K in keyof UpdateUserProfileRequest]: string;
}>;

const EMPTY_FORM: FormState = {
  fullName: "",
  phoneNumber: "",
  bio: "",
  addressLine1: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
};

const FULL_NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const CITY_REGEX = /^[a-zA-Z\s-]+$/;
const POSTAL_CODE_REGEX = /^[a-zA-Z0-9\s-]+$/;
const COUNTRY_REGEX = /^[a-zA-Z\s-]+$/;

function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("01")) {
    return trimmed.length === 11 && /^\d+$/.test(trimmed);
  }

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1);
    return digits.length >= 8 && digits.length <= 15 && /^\d+$/.test(digits);
  }

  return false;
}

function profileToForm(p: UserProfileResponse): FormState {
  return {
    fullName: p.fullName ?? "",
    phoneNumber: p.phoneNumber ?? "",
    bio: p.bio ?? "",
    addressLine1: p.addressLine1 ?? "",
    city: p.city ?? "",
    stateProvince: p.stateProvince ?? "",
    postalCode: p.postalCode ?? "",
    country: p.country ?? "",
  };
}

function diffForm(initial: FormState, current: FormState): UpdateUserProfileRequest {
  const diff: UpdateUserProfileRequest = {};
  (Object.keys(current) as (keyof FormState)[]).forEach((key) => {
    if (initial[key] !== current[key]) {
      diff[key] = current[key];
    }
  });
  return diff;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatLocation(p: UserProfileResponse): string[] {
  const lines: string[] = [];
  if (p.addressLine1) lines.push(p.addressLine1);

  const cityStateZip = [p.city, p.stateProvince, p.postalCode].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);

  if (p.country) lines.push(p.country);
  return lines;
}

export function MyProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [sellerSummary, setSellerSummary] = useState<SellerSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [banner, setBanner] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    getMyProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        const form = profileToForm(p);
        setInitialForm(form);
        setFormData(form);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    // Seller summary (products count) — non-blocking; failure leaves the count empty
    getMyListings({ pageNumber: 1, pageSize: 1 })
      .then((res) => {
        if (!cancelled) setSellerSummary(res.summary);
      })
      .catch(() => {
        // ignore — products card will fall back to "—"
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss banner
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.fullName.trim().length === 0) {
      errors.fullName = "Full name is required.";
    } else if (formData.fullName.length > 100) {
      errors.fullName = "Full name must not exceed 100 characters.";
    } else if (!FULL_NAME_REGEX.test(formData.fullName)) {
      errors.fullName = "Full name can only contain letters, spaces, hyphens, and apostrophes.";
    }

    if (formData.phoneNumber && !isValidPhone(formData.phoneNumber)) {
      errors.phoneNumber =
        "Phone must be Egyptian local (01XXXXXXXXX) or international (+ followed by 8–15 digits).";
    }

    if (formData.bio.length > 500) {
      errors.bio = "Bio must not exceed 500 characters.";
    }

    if (formData.addressLine1.length > 200) {
      errors.addressLine1 = "Address line must not exceed 200 characters.";
    }

    if (formData.city) {
      if (formData.city.length > 100) {
        errors.city = "City must not exceed 100 characters.";
      } else if (!CITY_REGEX.test(formData.city)) {
        errors.city = "City can only contain letters, spaces, and hyphens.";
      }
    }

    if (formData.stateProvince.length > 100) {
      errors.stateProvince = "State/Province must not exceed 100 characters.";
    }

    if (formData.postalCode) {
      if (formData.postalCode.length > 20) {
        errors.postalCode = "Postal code must not exceed 20 characters.";
      } else if (!POSTAL_CODE_REGEX.test(formData.postalCode)) {
        errors.postalCode = "Postal code can only contain letters, numbers, spaces, and hyphens.";
      }
    }

    if (formData.country) {
      if (formData.country.length > 100) {
        errors.country = "Country must not exceed 100 characters.";
      } else if (!COUNTRY_REGEX.test(formData.country)) {
        errors.country = "Country can only contain letters, spaces, and hyphens.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const diff = diffForm(initialForm, formData);
  const hasChanges = Object.keys(diff).length > 0;

  const handleSave = async () => {
    if (!validate()) {
      setBanner({ kind: "error", msg: "Please fix the highlighted errors." });
      return;
    }

    if (!hasChanges) {
      setBanner({ kind: "error", msg: "No changes to save." });
      return;
    }

    setIsSaving(true);
    setBanner(null);
    try {
      await updateMyProfile(diff);
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      const form = profileToForm(refreshed);
      setInitialForm(form);
      setFormData(form);
      setFieldErrors({});
      setIsEditing(false);
      setBanner({ kind: "success", msg: "Profile updated successfully." });
    } catch (err) {
      if (err instanceof AuthError && err.errors && typeof err.errors === "object") {
        const serverErrors: Record<string, string> = {};
        Object.entries(err.errors).forEach(([key, value]) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          const msg = Array.isArray(value) ? value[0] : String(value);
          serverErrors[camelKey] = msg ?? "Invalid value";
        });
        setFieldErrors(serverErrors);
        setBanner({ kind: "error", msg: err.message || "Validation failed." });
      } else {
        const msg = err instanceof Error ? err.message : "Failed to update profile.";
        setBanner({ kind: "error", msg });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setFieldErrors({});
    setIsEditing(false);
    setBanner(null);
  };

  const handleAvatarSelect: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so re-selecting same file fires onChange
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    setBanner(null);

    try {
      await updateProfileImage(file);
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      setBanner({ kind: "success", msg: "Profile picture updated." });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      const msg = err instanceof Error ? err.message : "Failed to upload picture.";
      setBanner({ kind: "error", msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    setBanner(null);
    try {
      await deleteProfileImage();
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setBanner({ kind: "success", msg: "Profile picture removed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove picture.";
      setBanner({ kind: "error", msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverSelect: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(previewUrl);
    setIsUploadingCover(true);
    setBanner(null);

    try {
      await updateCoverImage(file);
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      URL.revokeObjectURL(previewUrl);
      setCoverPreview(null);
      setBanner({ kind: "success", msg: "Cover image updated." });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setCoverPreview(null);
      const msg = err instanceof Error ? err.message : "Failed to upload cover.";
      setBanner({ kind: "error", msg });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCoverDelete = async () => {
    setIsUploadingCover(true);
    setBanner(null);
    try {
      await deleteCoverImage();
      const refreshed = await getMyProfile();
      setProfile(refreshed);
      setBanner({ kind: "success", msg: "Cover image removed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove cover.";
      setBanner({ kind: "error", msg });
    } finally {
      setIsUploadingCover(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{loadError ?? "Profile not available."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? profile.profileImageUrl ?? null;
  const coverSrc = coverPreview ?? profile.coverImageUrl ?? null;
  const initials = getInitials(formData.fullName || profile.fullName);
  const locationLines = formatLocation(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#7C3AED] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <button
              onClick={() => navigate("/account-settings")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              banner.kind === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {banner.msg}
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover + avatar */}
          <div className="relative">
            <div
              className={`h-40 sm:h-48 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] overflow-hidden ${!isEditing && coverSrc ? "cursor-pointer" : ""}`}
              onClick={() => !isEditing && coverSrc && setLightboxSrc(coverSrc)}
            >
              {coverSrc && (
                <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Cover controls (edit mode only) */}
            {isEditing && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium shadow hover:bg-white transition-colors disabled:opacity-60"
                >
                  <Camera className="w-4 h-4" />
                  {isUploadingCover ? "Uploading…" : "Change cover"}
                </button>
                {profile.coverImageUrl && !coverPreview && (
                  <button
                    type="button"
                    onClick={handleCoverDelete}
                    disabled={isUploadingCover}
                    className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium shadow hover:bg-white transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverSelect}
                />
              </div>
            )}

            {/* Avatar */}
            <div className="absolute -bottom-16 left-6 sm:left-8">
              <div className="relative">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl border-4 border-white overflow-hidden ${!isEditing && avatarSrc ? "cursor-pointer" : ""}`}
                  onClick={() => !isEditing && avatarSrc && setLightboxSrc(avatarSrc)}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 bg-[#7C3AED] text-white rounded-full p-2.5 shadow-lg hover:bg-[#6D28D9] transition-colors disabled:opacity-60"
                      aria-label="Change profile picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    {profile.profileImageUrl && !avatarPreview && (
                      <button
                        type="button"
                        onClick={handleAvatarDelete}
                        disabled={isUploadingAvatar}
                        className="absolute -bottom-1 -right-10 bg-white text-red-600 border border-red-200 rounded-full p-2 shadow hover:bg-red-50 transition-colors disabled:opacity-60"
                        aria-label="Remove profile picture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Edit / Save / Cancel */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-6">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-[#7C3AED] hover:bg-gray-50 font-semibold px-5 py-2 rounded-full shadow-lg transition-colors text-sm"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold px-4 py-2 rounded-full shadow text-sm disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-semibold px-5 py-2 rounded-full shadow hover:shadow-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile body */}
          <div className="pt-20 px-6 sm:px-8 pb-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {formData.fullName || profile.fullName}
              </h1>
              {profile.email && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column: editable fields */}
              <div className="space-y-6">
                <Field
                  id="fullName"
                  label="Full Name"
                  required
                  isEditing={isEditing}
                  value={formData.fullName}
                  display={profile.fullName}
                  onChange={(v) => handleChange("fullName", v)}
                  error={fieldErrors.fullName}
                  placeholder="Enter your full name"
                />

                {/* Email — always read-only; backend does not accept email changes here */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 py-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900 text-base">{profile.email ?? "—"}</p>
                  </div>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed from here.</p>
                  )}
                </div>

                <Field
                  id="phoneNumber"
                  label="Phone Number"
                  icon={<Phone className="w-5 h-5 text-gray-400" />}
                  isEditing={isEditing}
                  value={formData.phoneNumber}
                  display={profile.phoneNumber ?? "—"}
                  onChange={(v) => handleChange("phoneNumber", v)}
                  error={fieldErrors.phoneNumber}
                  placeholder="01XXXXXXXXX or +1234567890"
                  helper={
                    isEditing ? "Format: 01XXXXXXXXX (EG) or + followed by 8–15 digits." : undefined
                  }
                />

                <TextAreaField
                  id="bio"
                  label="Bio"
                  isEditing={isEditing}
                  value={formData.bio}
                  display={profile.bio ?? "—"}
                  onChange={(v) => handleChange("bio", v)}
                  error={fieldErrors.bio}
                  placeholder="Tell us about yourself…"
                  maxLength={500}
                />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>

                  {isEditing ? (
                    <div className="space-y-3">
                      <SimpleInput
                        value={formData.addressLine1}
                        onChange={(v) => handleChange("addressLine1", v)}
                        placeholder="Street address"
                        error={fieldErrors.addressLine1}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <SimpleInput
                          value={formData.city}
                          onChange={(v) => handleChange("city", v)}
                          placeholder="City"
                          error={fieldErrors.city}
                        />
                        <SimpleInput
                          value={formData.stateProvince}
                          onChange={(v) => handleChange("stateProvince", v)}
                          placeholder="State / Province"
                          error={fieldErrors.stateProvince}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <SimpleInput
                          value={formData.postalCode}
                          onChange={(v) => handleChange("postalCode", v)}
                          placeholder="Postal code"
                          error={fieldErrors.postalCode}
                        />
                        <SimpleInput
                          value={formData.country}
                          onChange={(v) => handleChange("country", v)}
                          placeholder="Country"
                          error={fieldErrors.country}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 py-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      {locationLines.length === 0 ? (
                        <p className="text-gray-500 text-base">No location set.</p>
                      ) : (
                        <div className="text-gray-900 text-base">
                          {locationLines.map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile stats */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Profile Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">{profile.followersCount}</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">{profile.followingCount}</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">
                        {sellerSummary ? sellerSummary.totalProducts : "—"}
                      </p>
                      <p className="text-sm text-gray-600">Products</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/followers-following")}
                    className="w-full mt-4 border border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Manage Followers
                  </button>
                </div>

                {/* Quick links */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-4">My Listings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your products, track performance, and create new listings.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/my-products")}
                    className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    View My Products
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/create-product")}
                    className="w-full mt-2 bg-[#4B0082] text-white hover:opacity-90 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    + Create New Listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxSrc}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain block"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small field components ─────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  isEditing: boolean;
  value: string;
  display: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  helper?: string;
  icon?: React.ReactNode;
}

function Field({
  id,
  label,
  required,
  isEditing,
  value,
  display,
  onChange,
  error,
  placeholder,
  helper,
  icon,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-gray-700 mb-2 block">
        {label} {required && "*"}
      </label>
      {isEditing ? (
        <div>
          <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
            <input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full ${icon ? "pl-10" : "px-3"} py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
                error ? "border-red-500" : "border-gray-300"
              } ${icon ? "pr-3" : ""}`}
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          {!error && helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-2 py-2">
          {icon}
          <p className="text-gray-900 text-base">{display}</p>
        </div>
      )}
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  isEditing: boolean;
  value: string;
  display: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}

function TextAreaField({
  id,
  label,
  isEditing,
  value,
  display,
  onChange,
  error,
  placeholder,
  maxLength,
}: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-gray-700 mb-2 block">
        {label}
      </label>
      {isEditing ? (
        <div>
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full min-h-[120px] resize-none px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            {error ? <p className="text-red-500 text-xs">{error}</p> : <span />}
            {maxLength && (
              <p className="text-gray-400 text-xs">
                {value.length}/{maxLength}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-900 text-base py-2 leading-relaxed whitespace-pre-wrap">
          {display}
        </p>
      )}
    </div>
  );
}

interface SimpleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function SimpleInput({ value, onChange, placeholder, error }: SimpleInputProps) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
