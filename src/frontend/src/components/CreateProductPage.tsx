import { useState, useEffect, useRef } from "react";
import { X, Plus, Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useNavigate } from "react-router-dom";
import { getCategoryTree, type CategoryResponse } from "../services/categoryService";
import {
  createRegularProduct,
  createWantedProduct,
  createSwapProduct,
  type ProductCondition,
} from "../services/productService";
import { EGYPT_CITIES, EGYPT_COUNTRY } from "./data/locations";

const CONDITIONS: { label: string; value: ProductCondition }[] = [
  { label: "New", value: "New" },
  { label: "Like New", value: "LikeNew" },
  { label: "Used", value: "Used" },
  { label: "Broken", value: "Broken" },
];

const RequiredMark = () => <span className="text-red-500">*</span>;

export function CreateProductPage() {
  const navigate = useNavigate();

  const [productType, setProductType] = useState<"Regular" | "Wanted" | "Swap">("Regular");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [wantedImageFiles, setWantedImageFiles] = useState<File[]>([]);
  const [wantedImagePreviews, setWantedImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    locationCity: "",
    condition: "" as ProductCondition | "",
    price: "",
    allowNegotiation: false,
    minPrice: "",
    maxPrice: "",
    wantedItemTitle: "",
    wantedItemDescription: "",
  });

  // ← Must be after formData
  const selectedCategoryName =
    categories.flatMap((p) => p.subcategories).find((s) => s.id === formData.categoryId)?.name ??
    "";

  const handleReorder = (from: number, to: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    const [f] = newFiles.splice(from, 1);
    const [p] = newPreviews.splice(from, 1);
    newFiles.splice(to, 0, f);
    newPreviews.splice(to, 0, p);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node))
        setCategoryOpen(false);
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const previewsRef = useRef(imagePreviews);
  previewsRef.current = imagePreviews;
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const wantedPreviewsRef = useRef(wantedImagePreviews);
  wantedPreviewsRef.current = wantedImagePreviews;
  useEffect(() => {
    return () => {
      wantedPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    getCategoryTree()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 10 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWantedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 10 - wantedImageFiles.length;
    const toAdd = files.slice(0, remaining);
    setWantedImageFiles((prev) => [...prev, ...toAdd]);
    setWantedImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeWantedImage = (index: number) => {
    URL.revokeObjectURL(wantedImagePreviews[index]);
    setWantedImageFiles((prev) => prev.filter((_, i) => i !== index));
    setWantedImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const set = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const validate = (): string => {
    if (!formData.title.trim()) return "Please enter a title";
    if (!formData.description.trim()) return "Please enter a description";
    if (!formData.categoryId) return "Please select a category";
    if (!formData.condition) return "Please select a condition";
    if (!formData.locationCity) return "Please select a city";
    if (imageFiles.length === 0) return "Please upload at least one image";
    if (productType === "Regular" && !formData.price) return "Please enter a price";
    if (productType === "Wanted" && (!formData.minPrice || !formData.maxPrice))
      return "Please enter a price range";
    if (productType === "Wanted" && parseFloat(formData.maxPrice) < parseFloat(formData.minPrice))
      return "Maximum price must be greater than or equal to minimum price";
    if (productType === "Swap" && (!formData.wantedItemTitle || !formData.wantedItemDescription))
      return "Please fill in both swap fields";
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const base = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        condition: formData.condition as ProductCondition,
        locationCity: formData.locationCity || undefined,
        locationCountry: formData.locationCity ? EGYPT_COUNTRY : undefined,
      };
      if (productType === "Regular") {
        await createRegularProduct({
          ...base,
          price: parseFloat(formData.price),
          allowNegotiation: formData.allowNegotiation,
          images: imageFiles,
        });
      } else if (productType === "Wanted") {
        await createWantedProduct({
          ...base,
          desiredPriceMin: parseFloat(formData.minPrice),
          desiredPriceMax: parseFloat(formData.maxPrice),
          images: imageFiles,
        });
      } else {
        await createSwapProduct({
          ...base,
          wantedItemTitle: formData.wantedItemTitle,
          wantedItemDescription: formData.wantedItemDescription,
          offerImages: imageFiles,
          wantedImages: wantedImageFiles.length > 0 ? wantedImageFiles : undefined,
        });
      }
      setShowSuccess(true);
      setTimeout(() => navigate("/my-products"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-[28px] font-bold text-gray-900 mb-3">Product Listed!</h2>
          <p className="text-gray-600 text-[16px]">
            Your product has been successfully published and is now visible to buyers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-[#4B0082] hover:underline mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-[36px] font-bold text-gray-900 mb-2">List Your Item</h1>
          <p className="text-gray-600 text-[16px]">
            Fill in the details below to create your listing
          </p>
          <p className="text-gray-500 text-[14px] mt-2">
            All fields marked with <RequiredMark /> are required.
          </p>
        </div>

        {/* Product Type */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-6">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-4">Product Type</h3>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden divide-x divide-gray-200">
            {(["Regular", "Wanted", "Swap"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProductType(type)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                  productType === type
                    ? "bg-[#4B0082] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {type === "Regular" ? "Regular Sale" : type}
              </button>
            ))}
          </div>
          {productType && (
            <p className="text-sm text-gray-500 mt-3">
              {productType === "Regular"
                ? "Sell at a fixed price"
                : productType === "Wanted"
                  ? "Looking to buy something"
                  : "Trade for another item"}
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-6">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-6">Basic Information</h3>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">
                Title <RequiredMark />
              </Label>
              <Input
                id="title"
                placeholder="e.g., Vintage Polaroid Camera SX-70"
                value={formData.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">
                Description <RequiredMark />
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your item in detail..."
                value={formData.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={1000}
                className="mt-2 min-h-[150px]"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.description.length} / 1000 characters
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Category <RequiredMark />
                </Label>
                <div className="relative mt-2" ref={categoryRef}>
                  <div
                    onClick={() => {
                      setCategoryOpen(true);
                      setCategorySearch("");
                    }}
                    className={`flex items-center justify-between w-full border rounded-md px-3 h-9 text-sm cursor-text transition-[color,box-shadow] ${
                      categoryOpen
                        ? "border-[#4B0082] ring-[3px] ring-[#4B0082]/20"
                        : "border-gray-300"
                    }`}
                  >
                    {categoryOpen ? (
                      <input
                        autoFocus
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="flex-1 outline-none bg-transparent text-sm"
                      />
                    ) : (
                      <span
                        className={selectedCategoryName ? "text-gray-900" : "text-muted-foreground"}
                      >
                        {selectedCategoryName || "Select category"}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  {categoryOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
                      {(() => {
                        const filtered = categories
                          .map((parent) => ({
                            ...parent,
                            matchingSubs: parent.subcategories.filter((sub) =>
                              sub.name.toLowerCase().includes(categorySearch.toLowerCase())
                            ),
                          }))
                          .filter((parent) => parent.matchingSubs.length > 0);
                        return filtered.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No categories found
                          </p>
                        ) : (
                          filtered.map((parent) => (
                            <div key={parent.id}>
                              <p className="text-xs text-gray-400 font-semibold px-3 pt-3 pb-1">
                                {parent.name}
                              </p>
                              {parent.matchingSubs.map((sub) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    set("categoryId", sub.id);
                                    setCategoryOpen(false);
                                    setCategorySearch("");
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                    formData.categoryId === sub.id
                                      ? "text-[#4B0082] font-medium bg-purple-50"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          ))
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>
                  Condition <RequiredMark />
                </Label>
                <Select value={formData.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-6">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-6">Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                City <RequiredMark />
              </Label>
              <div className="relative mt-2" ref={cityRef}>
                <div
                  onClick={() => {
                    setCityOpen(true);
                    setCitySearch("");
                  }}
                  className={`flex items-center justify-between w-full border rounded-md px-3 h-9 text-sm cursor-text transition-[color,box-shadow] ${
                    cityOpen ? "border-[#4B0082] ring-[3px] ring-[#4B0082]/20" : "border-gray-300"
                  }`}
                >
                  {cityOpen ? (
                    <input
                      autoFocus
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search cities..."
                      className="flex-1 outline-none bg-transparent text-sm"
                    />
                  ) : (
                    <span
                      className={formData.locationCity ? "text-gray-900" : "text-muted-foreground"}
                    >
                      {formData.locationCity || "Select city"}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
                {cityOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
                    {(() => {
                      const filtered = EGYPT_CITIES.filter((city) =>
                        city.toLowerCase().includes(citySearch.toLowerCase())
                      );
                      return filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No cities found</p>
                      ) : (
                        filtered.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              set("locationCity", city);
                              setCityOpen(false);
                              setCitySearch("");
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              formData.locationCity === city
                                ? "text-[#4B0082] font-medium bg-purple-50"
                                : "text-gray-900"
                            }`}
                          >
                            {city}
                          </button>
                        ))
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <div className="flex items-center w-full border border-gray-200 rounded-md px-3 h-9 mt-2 text-sm text-gray-500 bg-gray-50">
                {EGYPT_COUNTRY}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing / Swap Details */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-6">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-6">
            {productType === "Regular" && "Pricing"}
            {productType === "Wanted" && "Desired Price Range"}
            {productType === "Swap" && "Swap Details"}
          </h3>

          {productType === "Regular" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">
                  Price <RequiredMark />
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => set("price", e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowNegotiation"
                  checked={formData.allowNegotiation}
                  onChange={(e) => set("allowNegotiation", e.target.checked)}
                  className="w-4 h-4 accent-[#4B0082]"
                />
                <Label htmlFor="allowNegotiation" className="cursor-pointer">
                  Allow negotiation
                </Label>
              </div>
            </div>
          )}

          {productType === "Wanted" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="minPrice">
                  Minimum Price <RequiredMark />
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <Input
                    id="minPrice"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={formData.minPrice}
                    onChange={(e) => set("minPrice", e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxPrice">
                  Maximum Price <RequiredMark />
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={formData.maxPrice}
                    onChange={(e) => set("maxPrice", e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          )}

          {productType === "Swap" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="wantedItemTitle">
                  I'm Offering — Title <RequiredMark />
                </Label>
                <Input
                  id="wantedItemTitle"
                  placeholder="e.g., MacBook Pro 2020"
                  value={formData.wantedItemTitle}
                  onChange={(e) => set("wantedItemTitle", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="wantedItemDescription">
                  I'm Looking For — Description <RequiredMark />
                </Label>
                <Textarea
                  id="wantedItemDescription"
                  placeholder="Describe what you want in return..."
                  value={formData.wantedItemDescription}
                  onChange={(e) => set("wantedItemDescription", e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Shipping — TODO: backend not ready */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-6 opacity-50">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[20px] font-semibold text-gray-900">Shipping Information</h3>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Shipping options will be available in a future update.
          </p>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-4">
            {productType === "Swap" ? "Photos of Your Item" : "Photos"} <RequiredMark />
          </h3>
          <p className="text-gray-600 text-[14px] mb-6">
            Add at least 1 photo. Max 10 images, up to 5 MB each.
          </p>
          <label
            className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              imageFiles.length >= 10
                ? "border-gray-200 cursor-not-allowed opacity-50"
                : "border-gray-300 cursor-pointer hover:border-[#4B0082] hover:bg-gray-50"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={imageFiles.length >= 10}
            />
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">Click to add photos</p>
            <p className="text-sm text-gray-500">
              PNG, JPG up to 5 MB each ({imageFiles.length}/10)
            </p>
          </label>

          {imagePreviews.length > 0 && (
            <>
              <p className="text-xs text-gray-400 mt-4 mb-2">
                Drag to reorder · First image is the cover
              </p>
              <div className="grid grid-cols-5 gap-4">
                {imagePreviews.map((src, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => {
                      hasDraggedRef.current = false;
                      dragIndexRef.current = i;
                      setDraggingIndex(i);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== i) setDragOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndexRef.current !== null && dragIndexRef.current !== i)
                        handleReorder(dragIndexRef.current, i);
                      dragIndexRef.current = null;
                      setDraggingIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      hasDraggedRef.current = true;
                      dragIndexRef.current = null;
                      setDraggingIndex(null);
                      setDragOverIndex(null);
                    }}
                    onClick={() => {
                      if (!hasDraggedRef.current) setLightboxIndex(i);
                      hasDraggedRef.current = false;
                    }}
                    className={`relative group cursor-grab active:cursor-grabbing transition-all duration-150 ${
                      draggingIndex === i ? "opacity-40 scale-95" : ""
                    } ${
                      dragOverIndex === i && draggingIndex !== i
                        ? "ring-2 ring-[#4B0082] rounded-lg scale-105"
                        : ""
                    }`}
                  >
                    {i === 0 && (
                      <div className="absolute -top-2 -left-2 bg-[#4B0082] text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                        Cover
                      </div>
                    )}
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      draggable={false}
                      className="w-full aspect-square object-cover rounded-lg pointer-events-none select-none"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(i);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Wanted Images (Swap only) */}
        {productType === "Swap" && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
            <h3 className="text-[20px] font-semibold text-gray-900 mb-4">
              Photos of What You Want
            </h3>
            <p className="text-gray-600 text-[14px] mb-6">
              Optional. Add reference photos of the item you want in return. Max 10 images, up to 5
              MB each.
            </p>
            <label
              className={`block border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                wantedImageFiles.length >= 10
                  ? "border-gray-200 cursor-not-allowed opacity-50"
                  : "border-gray-300 cursor-pointer hover:border-[#4B0082] hover:bg-gray-50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleWantedImageUpload}
                className="hidden"
                disabled={wantedImageFiles.length >= 10}
              />
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">Click to add photos</p>
              <p className="text-sm text-gray-500">
                PNG, JPG up to 5 MB each ({wantedImageFiles.length}/10)
              </p>
            </label>

            {wantedImagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mt-4">
                {wantedImagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`Wanted ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg select-none"
                    />
                    <button
                      onClick={() => removeWantedImage(i)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className="absolute left-4 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            )}

            {/* Image + X button together */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={imagePreviews[lightboxIndex]}
                alt={`Preview ${lightboxIndex + 1}`}
                className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
              />
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-1.5 hover:bg-gray-100 transition shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {lightboxIndex < imagePreviews.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                className="absolute right-4 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition"
              >
                <ChevronDown className="w-6 h-6 -rotate-90" />
              </button>
            )}

            <p className="absolute bottom-4 text-white/70 text-sm">
              {lightboxIndex + 1} / {imagePreviews.length}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              "Publish Listing"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
