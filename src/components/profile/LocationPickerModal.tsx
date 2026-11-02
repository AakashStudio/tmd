"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [selectedCityName, setSelectedCityName] = useState<string>(currentCity || "");

  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(true);
  const [isLoadingStates, setIsLoadingStates] = useState<boolean>(false);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const isInitialMountRef = useRef<boolean>(true);

  // 1. Fetch Countries on Mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingCountries(true);
    isInitialMountRef.current = true;

    fetch("/api/geo?type=countries")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: CountryItem[] = data.countries || [];
        setCountries(list);

        // Preselect current country if matches
        if (currentCountry) {
          const match = list.find(
            (c) =>
              c.name.toLowerCase() === currentCountry.toLowerCase() ||
              c.code.toLowerCase() === currentCountry.toLowerCase()
          );
          if (match) {
            setSelectedCountryCode(match.code);
            setSelectedCountryName(match.name);
          } else {
            setSelectedCountryCode(list[0]?.code || "IN");
            setSelectedCountryName(list[0]?.name || "India");
          }
        } else {
          setSelectedCountryCode("IN");
          setSelectedCountryName("India");
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

        if (isInitialMountRef.current && currentState) {
          // Initial mount: try to match current state
          const match = list.find(
            (s) =>
              s.name.toLowerCase() === currentState.toLowerCase() ||
              s.code.toLowerCase() === currentState.toLowerCase()
          );
          if (match) {
            setSelectedStateCode(match.code);
            setSelectedStateName(match.name);
          } else if (list.length > 0) {
            setSelectedStateCode(list[0].code);
            setSelectedStateName(list[0].name);
          }
        } else if (isInitialMountRef.current && selectedCountryCode === "IN") {
          // Default to Delhi if initial mount in India
          const delhiState = list.find((s) => s.name.toLowerCase() === "delhi") || list[0];
          if (delhiState) {
            setSelectedStateCode(delhiState.code);
            setSelectedStateName(delhiState.name);
          }
        } else {
          // Manual user country change: reset state so user picks from dropdown
          setSelectedStateCode("");
          setSelectedStateName("");
          setSelectedCityName("");
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

  // 3. Fetch Cities when selectedCountryCode and selectedStateCode change
  useEffect(() => {
    if (!selectedCountryCode || !selectedStateCode) {
      setCities([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCities(true);

    fetch(`/api/geo?type=cities&country=${selectedCountryCode}&state=${selectedStateCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list: CityItem[] = data.cities || [];
        setCities(list);

        if (isInitialMountRef.current && currentCity) {
          const match = list.find(
            (c) => c.name.toLowerCase() === currentCity.toLowerCase()
          );
          if (match) {
            setSelectedCityName(match.name);
          } else if (list.length > 0) {
            setSelectedCityName(list[0].name);
          }
        } else if (list.length === 1) {
          // Only 1 city available in state, auto-select
          setSelectedCityName(list[0].name);
        } else {
          // Reset city selection so user picks from dropdown
          setSelectedCityName("");
        }

        // Once initial mount flow has completed, set flag to false
        isInitialMountRef.current = false;
      })
      .catch((err) => console.error("Error fetching cities:", err))
      .finally(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode, selectedStateCode, currentCity]);

  // Handle Country selection change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    isInitialMountRef.current = false;
    const code = e.target.value;
    const item = countries.find((c) => c.code === code);
    setSelectedCountryCode(code);
    setSelectedCountryName(item ? item.name : "");
    setSelectedStateCode("");
    setSelectedStateName("");
    setSelectedCityName("");
    setCities([]);
    setGpsMessage(null);
  };

  // Handle State selection change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    isInitialMountRef.current = false;
    const code = e.target.value;
    const item = states.find((s) => s.code === code);
    setSelectedStateCode(code);
    setSelectedStateName(item ? item.name : "");
    setSelectedCityName("");
    setGpsMessage(null);
  };

  // Handle City selection change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCityName(cityName);
    const cityObj = cities.find((c) => c.name === cityName);
    if (cityObj?.latitude) setLatitude(parseFloat(cityObj.latitude));
    if (cityObj?.longitude) setLongitude(parseFloat(cityObj.longitude));
    setGpsMessage(null);
  };

  // Auto-detect GPS button
  const handleDetectGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const cCode = data.countryCode || "IN";
            const cName = data.countryName || "India";
            const sName = data.principalSubdivision || "";
            const cityName = data.city || data.locality || data.principalSubdivision || "";

            setSelectedCountryCode(cCode);
            setSelectedCountryName(cName);

            // Fetch states for detected country
            const stateRes = await fetch(`/api/geo?type=states&country=${cCode}`);
            const stateData = await stateRes.json();
            const stateList: StateItem[] = stateData.states || [];
            setStates(stateList);

            // Match state
            const matchedState = stateList.find(
              (s) =>
                s.name.toLowerCase() === sName.toLowerCase() ||
                s.code.toLowerCase() === sName.toLowerCase()
            );

            const activeStateCode = matchedState ? matchedState.code : stateList[0]?.code || "";
            const activeStateName = matchedState ? matchedState.name : stateList[0]?.name || sName;

            setSelectedStateCode(activeStateCode);
            setSelectedStateName(activeStateName);

            // Fetch cities for detected state
            if (activeStateCode) {
              const cityRes = await fetch(
                `/api/geo?type=cities&country=${cCode}&state=${activeStateCode}`
              );
              const cityData = await cityRes.json();
              const cityList: CityItem[] = cityData.cities || [];
              setCities(cityList);

              const matchedCity = cityList.find(
                (c) => c.name.toLowerCase() === cityName.toLowerCase()
              );
              setSelectedCityName(
                matchedCity ? matchedCity.name : cityName || cityList[0]?.name || ""
              );
            } else {
              setSelectedCityName(cityName);
            }

            setGpsMessage(`✓ Auto-detected: ${cityName || activeStateName}, ${cName}`);
          }
        } catch (err) {
          console.warn("GPS reverse geocode error:", err);
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsDetectingGps(false);
        alert("Could not detect location. Please select country, state, and city from dropdowns.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = async () => {
    const finalCity = selectedCityName.trim() || selectedStateName || "Delhi";
    const selectedCityObj = cities.find(
      (c) => c.name.toLowerCase() === finalCity.toLowerCase()
    );

    const lat = latitude ?? (selectedCityObj?.latitude ? parseFloat(selectedCityObj.latitude) : undefined);
    const lng = longitude ?? (selectedCityObj?.longitude ? parseFloat(selectedCityObj.longitude) : undefined);

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
      <div className="w-full max-w-sm bg-[#121217] border border-zinc-800 rounded-3xl p-5 text-white flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-[#FFC629] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Select Location</h3>
              <p className="text-xs text-zinc-400">Country, State & City Dropdowns</p>
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
          {/* Quick GPS Auto-detect Button */}
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={isDetectingGps}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:brightness-110 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            {isDetectingGps ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-detecting via GPS...</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>⚡ Auto-Detect Location (GPS)</span>
              </>
            )}
          </button>

          {gpsMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{gpsMessage}</span>
            </div>
          )}

          {/* 1. Country Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#FFC629]" />
                <span>1. Select Country</span>
              </label>
              {isLoadingCountries && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </div>

            <div className="relative">
              <select
                value={selectedCountryCode}
                onChange={handleCountryChange}
                disabled={isLoadingCountries}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10"
              >
                {isLoadingCountries && (
                  <option value="" disabled className="bg-zinc-900 text-zinc-400">
                    Loading countries...
                  </option>
                )}
                {countries.map((c) => (
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
                <option value="" disabled className="bg-zinc-900 text-zinc-400">
                  {isLoadingStates
                    ? "Loading states..."
                    : states.length === 0
                    ? "No states available"
                    : "-- Select State / Province --"}
                </option>
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

            <div className="relative">
              <select
                value={selectedCityName}
                onChange={handleCityChange}
                disabled={isLoadingCities || !selectedStateCode || cities.length === 0}
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs font-semibold focus:outline-none focus:border-[#FFC629] appearance-none cursor-pointer pr-10 disabled:opacity-50"
              >
                <option value="" disabled className="bg-zinc-900 text-zinc-400">
                  {isLoadingCities
                    ? "Loading cities..."
                    : !selectedStateCode
                    ? "-- Select a state first --"
                    : cities.length === 0
                    ? "No cities available"
                    : "-- Select City --"}
                </option>
                {cities.map((city, idx) => (
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
              <span className="font-extrabold text-white text-xs truncate block">
                {selectedCityName || "Select city"}
                {selectedStateName ? `, ${selectedStateName}` : ""}
                {selectedCountryName ? `, ${selectedCountryName}` : ""}
              </span>
            </div>
            {selectedCityName && (
              <Check className="w-4 h-4 text-[#FFC629] shrink-0 stroke-[3]" />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 pb-1 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || !selectedCityName}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black font-extrabold text-sm transition hover:brightness-105 active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
