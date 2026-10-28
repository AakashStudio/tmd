import { NextRequest, NextResponse } from "next/server";
import { Country, State, City } from "country-state-city";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "countries" | "states" | "cities"
    const countryCode = searchParams.get("country");
    const stateCode = searchParams.get("state");

    if (type === "countries" || !type) {
      const allCountries = Country.getAllCountries().map((c) => ({
        code: c.isoCode,
        name: c.name,
        flag: c.flag,
      }));

      // Prioritize top popular dating countries, then rest alphabetically
      const topCodes = ["IN", "US", "GB", "AE", "CA", "AU", "SG", "DE", "FR"];
      const topCountries = topCodes
        .map((code) => allCountries.find((c) => c.code === code))
        .filter(Boolean) as typeof allCountries;

      const restCountries = allCountries.filter(
        (c) => !topCodes.includes(c.code)
      );

      return NextResponse.json({
        countries: [...topCountries, ...restCountries],
      });
    }

    if (type === "states") {
      if (!countryCode) {
        return NextResponse.json(
          { error: "country parameter is required for states" },
          { status: 400 }
        );
      }

      const states = State.getStatesOfCountry(countryCode).map((s) => ({
        code: s.isoCode,
        name: s.name,
      }));

      return NextResponse.json({ states });
    }

    if (type === "cities") {
      if (!countryCode) {
        return NextResponse.json(
          { error: "country parameter is required for cities" },
          { status: 400 }
        );
      }

      let cities: Array<{ name: string; latitude?: string; longitude?: string }> = [];

      if (stateCode) {
        cities = City.getCitiesOfState(countryCode, stateCode).map((c) => ({
          name: c.name,
          latitude: c.latitude || undefined,
          longitude: c.longitude || undefined,
        }));
      }

      // If state has no listed cities or no state provided, fallback to country cities
      if (cities.length === 0) {
        const countryCities = City.getCitiesOfCountry(countryCode) || [];
        cities = countryCities.slice(0, 100).map((c) => ({
          name: c.name,
          latitude: c.latitude || undefined,
          longitude: c.longitude || undefined,
        }));
      }

      return NextResponse.json({ cities });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("Geo API error:", err);
    return NextResponse.json(
      { error: "Failed to load geo data" },
      { status: 500 }
    );
  }
}
