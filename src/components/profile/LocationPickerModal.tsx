"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, MapPin, Globe, Compass, Check, ChevronDown, Loader2 } from "lucide-react";

interface CountryItem {
  code: string;
  name: string;
  flag: string;
}

interface StateItem {
  code: string;
  name: string;
}

interface CityItem {
  name: string;
  latitude?: string;
  longitude?: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity?: string | null;
  currentState?: string | null;
  currentCountry?: string | null;
  onSave: (location: {
    city: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  currentCity = "Delhi",
  currentState,
  currentCountry = "India",
  onSave,
  isSaving = false,
}: LocationPickerModalProps) {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IN");
  const [selectedCountryName, setSelectedCountryName] = useState<string>("India");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [selectedStateName, setSelectedStateName] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>(currentCity || "Delhi");

  const [countrySearch, setCountrySearch] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");

  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(true);
  const [isLoadingStates, setIsLoadingStates] = useState<boolean>(false);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  // 1. Fetch Countries on Mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingCountries(true);

    fetch("/api/geo?type=countries")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: CountryItem[] = data.countries || [];
        setCountries(list);

        // Preselect current country if matches
        if (currentCountry) {
          const match = list.find(
            (c) => c.name.toLowerCase() === currentCountry.toLowerCase()
          );
          if (match) {
            setSelectedCountryCode(match.code);
            setSelectedCountryName(match.name);
          }
        }
      })
      .catch((err) => console.error("Error fetching countries:", err))
      .finally(() => {
        if (isMounted) setIsLoadingCountries(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentCountry]);

  // 2. Fetch States when selectedCountryCode changes
  useEffect(() => {
    if (!selectedCountryCode) {
      setStates([]);
      setSelectedStateCode("");
      setSelectedStateName("");
      return;
    }

    let isMounted = true;
    setIsLoadingStates(true);

    fetch(`/api/geo?type=states&country=${selectedCountryCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: StateItem[] = data.states || [];
        setStates(list);

        // Try to match currentState or default to first / matching
        let defaultState = list[0];
        if (currentState) {
          const match = list.find(
            (s) =>
              s.name.toLowerCase() === currentState.toLowerCase() ||
              s.code.toLowerCase() === currentState.toLowerCase()
          );
          if (match) defaultState = match;
        } else if (selectedCountryCode === "IN") {
          // If in India and city is Delhi, find Delhi state
          const delhiState = list.find((s) => s.name.toLowerCase() === "delhi");
          if (delhiState) defaultState = delhiState;
        }

        if (defaultState) {
          setSelectedStateCode(defaultState.code);
          setSelectedStateName(defaultState.name);
        } else {
          setSelectedStateCode("");
          setSelectedStateName("");
        }
      })
      .catch((err) => console.error("Error fetching states:", err))
      .finally(() => {
        if (isMounted) setIsLoadingStates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode, currentState]);

  // 3. Fetch Cities when selectedCountryCode and selectedStateCode changes
  useEffect(() => {
    if (!selectedCountryCode) {
      setCities([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCities(true);

    const url = selectedStateCode
      ? `/api/geo?type=cities&country=${selectedCountryCode}&state=${selectedStateCode}`
      : `/api/geo?type=cities&country=${selectedCountryCode}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: CityItem[] = data.cities || [];
        setCities(list);

        // Preselect city if matches currentCity
        if (currentCity) {
          const match = list.find(
            (c) => c.name.toLowerCase() === currentCity.toLowerCase()
          );
          if (match) {
            setSelectedCityName(match.name);
          } else if (list.length > 0 && !selectedCityName) {
            setSelectedCityName(list[0].name);
          }
        } else if (list.length > 0 && !selectedCityName) {
          setSelectedCityName(list[0].name);
        }
      })
      .catch((err) => console.error("Error fetching cities:", err))
      .finally(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode, selectedStateCode, currentCity]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countries, countrySearch]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    const q = citySearch.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, citySearch]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = countries.find((c) => c.code === code);
    setSelectedCountryCode(code);
    setSelectedCountryName(item ? item.name : "");
    setSelectedStateCode("");
    setSelectedStateName("");
    setSelectedCityName("");
    setCitySearch("");
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = states.find((s) => s.code === code);
    setSelectedStateCode(code);
    setSelectedStateName(item ? item.name : "");
    setSelectedCityName("");
    setCitySearch("");
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCityName(e.target.value);
  };

  const handleConfirm = async () => {
    const finalCity = selectedCityName.trim() || selectedStateName || "Delhi";
    const selectedCityObj = cities.find(
      (c) => c.name.toLowerCase() === finalCity.toLowerCase()
    );

    const lat = selectedCityObj?.latitude ? parseFloat(selectedCityObj.latitude) : undefined;
    const lng = selectedCityObj?.longitude ? parseFloat(selectedCityObj.longitude) : undefined;

    await onSave({
      city: finalCity,
      state: selectedStateName || undefined,
      country: selectedCountryName || "India",
      latitude: lat,
      longitude: lng,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-[#121217] border border-zinc-800 rounded-3xl p-5 text-white flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-[#FFC629] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Select Location</h3>
              <p className="text-xs text-zinc-400">Worldwide Country, State & City</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
          {/* 1. Country Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>1. Select Country (Worldwide)</span>
              </label>
              {isLoadingCountries && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </div>

            {/* Quick Country Search */}
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="Search country name or code..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC629] mb-1.5"
            />

            <div className="relative">
              <select
                value={selectedCountryCode}
                onChange={handleCountryChange}
                disabled={isLoadingCountries}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10"
              >
                {filteredCountries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. State / Province Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>2. Select State / Province</span>
              </label>
              {isLoadingStates && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </div>

            <div className="relative">
              <select
                value={selectedStateCode}
                onChange={handleStateChange}
                disabled={isLoadingStates || states.length === 0}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10 disabled:opacity-50"
              >
                {states.length === 0 && (
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    {isLoadingStates ? "Loading states..." : "No states available"}
                  </option>
                )}
                {states.map((s) => (
                  <option key={s.code} value={s.code} className="bg-zinc-900 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. City Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>3. Select City</span>
              </label>
              {isLoadingCities && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </div>

            {/* Quick City Search Filter */}
            {cities.length > 10 && (
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search city in this state..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC629] mb-1.5"
              />
            )}

            <div className="relative">
              <select
                value={selectedCityName}
                onChange={handleCityChange}
                disabled={isLoadingCities || cities.length === 0}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10 disabled:opacity-50"
              >
                {cities.length === 0 && (
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    {isLoadingCities ? "Loading cities..." : "No cities available"}
                  </option>
                )}
                {filteredCities.map((city, idx) => (
                  <option key={`${city.name}-${idx}`} value={city.name} className="bg-zinc-900 text-white">
                    {city.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Selection Preview Card */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2.5">
            <span className="text-base">📍</span>
            <div className="flex-1 truncate">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Selected Location:
              </span>
              <span className="font-extrabold text-white text-xs">
                {selectedCityName || "Select city"}
                {selectedStateName ? `, ${selectedStateName}` : ""}
                {selectedCountryName ? `, ${selectedCountryName}` : ""}
              </span>
            </div>
            <Check className="w-4 h-4 text-[#FFC629] shrink-0 stroke-[3]" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 pb-1 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || !selectedCityName}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold text-sm transition hover:brightness-105 active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Location...</span>
              </>
            ) : (
              "Confirm & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
