import { useState } from "react";
import {
  X,
  SlidersHorizontal,
  MapPin,
  DollarSign,
  Package,
  Truck,
  Bookmark,
  Bell,
} from "lucide-react";

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FilterPreset {
  id: string;
  name: string;
  hasAlert: boolean;
  filters: {
    location?: string;
    priceMin?: number;
    priceMax?: number;
    status?: string[];
    type?: string[];
    hasShipping?: boolean;
  };
}

export function AdvancedFilters({ isOpen, onClose }: AdvancedFiltersProps) {
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [hasShipping, setHasShipping] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([
    {
      id: "1",
      name: "Local Vintage Furniture",
      hasAlert: true,
      filters: {
        location: "Within 25 miles",
        priceMin: 50,
        priceMax: 500,
        status: ["Used", "Like New"],
        type: ["Regular"],
      },
    },
    {
      id: "2",
      name: "Designer Bags Under $200",
      hasAlert: false,
      filters: {
        priceMax: 200,
        status: ["Like New", "New"],
        hasShipping: true,
      },
    },
  ]);

  const productStatuses = ["New", "Like New", "Used", "Broken"];
  const productTypes = ["Regular", "Wanted", "Swap"];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name: presetName,
        hasAlert: false,
        filters: {
          location,
          priceMin: priceMin ? parseFloat(priceMin) : undefined,
          priceMax: priceMax ? parseFloat(priceMax) : undefined,
          status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
          type: selectedTypes.length > 0 ? selectedTypes : undefined,
          hasShipping,
        },
      };
      setSavedPresets([...savedPresets, newPreset]);
      setPresetName("");
      setShowSavePreset(false);
    }
  };

  const loadPreset = (preset: FilterPreset) => {
    setLocation(preset.filters.location || "");
    setPriceMin(preset.filters.priceMin?.toString() || "");
    setPriceMax(preset.filters.priceMax?.toString() || "");
    setSelectedStatuses(preset.filters.status || []);
    setSelectedTypes(preset.filters.type || []);
    setHasShipping(preset.filters.hasShipping || false);
  };

  const togglePresetAlert = (id: string) => {
    setSavedPresets(savedPresets.map((p) => (p.id === id ? { ...p, hasAlert: !p.hasAlert } : p)));
  };

  const deletePreset = (id: string) => {
    setSavedPresets(savedPresets.filter((p) => p.id !== id));
  };

  const clearAllFilters = () => {
    setLocation("");
    setPriceMin("");
    setPriceMax("");
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setHasShipping(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] transition-opacity" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-[9999] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-[#4169E1]" />
            <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Location Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Location</label>
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1]"
            >
              <option value="">Anywhere</option>
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Price Range</label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1]"
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1]"
                />
              </div>
            </div>
          </div>

          {/* Product Status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Product Condition</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {productStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedStatuses.includes(status)
                      ? "bg-[#4169E1] border-[#4169E1] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#4169E1] hover:text-[#4169E1]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Listing Type</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {productTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedTypes.includes(type)
                      ? "bg-[#4169E1] border-[#4169E1] text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-[#4169E1] hover:text-[#4169E1]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Availability */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-900">Shipping</label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasShipping}
                onChange={(e) => setHasShipping(e.target.checked)}
                className="w-5 h-5 text-[#4169E1] border-gray-300 rounded focus:ring-[#4169E1]"
              />
              <span className="text-sm text-gray-700">Only show items with app shipping</span>
            </label>
          </div>

          {/* Saved Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-gray-600" />
                <label className="text-sm font-semibold text-gray-900">Saved Presets</label>
              </div>
              <button
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-sm text-[#4169E1] font-medium hover:text-[#3557c7]"
              >
                + Save Current
              </button>
            </div>

            {/* Save Preset Form */}
            {showSavePreset && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#4169E1]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePreset}
                    className="flex-1 bg-[#4169E1] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#3557c7]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSavePreset(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Preset List */}
            <div className="space-y-2">
              {savedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#4169E1] transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <button onClick={() => loadPreset(preset)} className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePresetAlert(preset.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={preset.hasAlert ? "Disable alerts" : "Enable alerts"}
                      >
                        {preset.hasAlert ? (
                          <Bell className="w-4 h-4 text-[#4169E1]" />
                        ) : (
                          <Bell className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                        title="Delete preset"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preset.filters.location && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        {preset.filters.location}
                      </span>
                    )}
                    {(preset.filters.priceMin || preset.filters.priceMax) && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        ${preset.filters.priceMin || "0"} - ${preset.filters.priceMax || "∞"}
                      </span>
                    )}
                    {preset.filters.status?.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-[#4169E1] text-white font-semibold rounded-lg hover:bg-[#3557c7] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
