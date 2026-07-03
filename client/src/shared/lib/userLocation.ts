const USER_CITY_KEY = 'user_city';
const USER_COORDS_KEY = 'user_coords';
export const USER_LOCATION_UPDATED_EVENT = 'user-location-updated';
export const OPEN_CITY_MODAL_EVENT = 'open-city-modal';

export type UserCoords = {
  lat: number;
  lon: number;
};

export type UserLocation = {
  city: string | null;
  coords: UserCoords | null;
};

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

type NominatimSearchResult = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
};

type GeocodedCityResult = {
  city: string;
  coords: UserCoords;
};

function toTitleCase(input: string): string {
  return input
    .split('-')
    .map((part) => {
      if (!part) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('-');
}

function normalizeCityName(rawCity: string): string {
  const trimmed = rawCity.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed
    .split(/\s+/)
    .map((word) => toTitleCase(word))
    .join(' ');
}

function resolveCityFromSearchResult(searchResult: NominatimSearchResult): string | null {
  const address = searchResult.address;
  const directCity =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    searchResult.name;

  if (directCity?.trim()) {
    return normalizeCityName(directCity);
  }

  const [firstChunk] = searchResult.display_name?.split(',') ?? [];
  if (firstChunk?.trim()) {
    return normalizeCityName(firstChunk);
  }

  return null;
}

export const userLocationStorage = {
  getCity(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(USER_CITY_KEY);
  },
  getCoords(): UserCoords | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(USER_COORDS_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserCoords>;
      if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') {
        return null;
      }
      return { lat: parsed.lat, lon: parsed.lon };
    } catch {
      return null;
    }
  },
  setCity(city: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_CITY_KEY, city);
    }
  },
  setCoords(coords: UserCoords): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_COORDS_KEY, JSON.stringify(coords));
    }
  },
  clearCoords(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_COORDS_KEY);
    }
  },
  setLocation(location: UserLocation): void {
    if (location.city) {
      this.setCity(location.city);
    }
    if (location.coords) {
      this.setCoords(location.coords);
    } else {
      this.clearCoords();
    }
  },
};

function notifyUserLocationUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(USER_LOCATION_UPDATED_EVENT));
  }
}

export function requestOpenCityModal(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_CITY_MODAL_EVENT));
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  });
}

async function getCityByCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`,
    );
    const data = (await response.json()) as NominatimResponse;

    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.state ||
      null
    );
  } catch {
    return null;
  }
}

type IpApiResponse = {
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
};

async function getLocationByIP(): Promise<UserLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = (await response.json()) as IpApiResponse;
    const city = data.city || data.region || null;
    if (!city) {
      return null;
    }

    return {
      city: normalizeCityName(city),
      coords:
        typeof data.latitude === 'number' && typeof data.longitude === 'number'
          ? { lat: data.latitude, lon: data.longitude }
          : null,
    };
  } catch {
    return null;
  }
}

async function geocodeCity(city: string): Promise<GeocodedCityResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(city)}`,
    );
    const data = (await response.json()) as NominatimSearchResult[];
    const firstResult = data[0];
    if (!firstResult?.lat || !firstResult?.lon) {
      return null;
    }

    const lat = Number.parseFloat(firstResult.lat);
    const lon = Number.parseFloat(firstResult.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    const correctedCity = resolveCityFromSearchResult(firstResult) || normalizeCityName(city);
    return {
      city: correctedCity,
      coords: { lat, lon },
    };
  } catch {
    return null;
  }
}

export async function setAndStoreUserCity(city: string): Promise<UserLocation> {
  const normalizedCity = city.trim();
  if (!normalizedCity) {
    throw new Error('City is required');
  }

  const geocodedCity = await geocodeCity(normalizedCity);
  const location: UserLocation = {
    city: geocodedCity?.city ?? normalizeCityName(normalizedCity),
    coords: geocodedCity?.coords ?? null,
  };
  userLocationStorage.setLocation(location);
  notifyUserLocationUpdated();

  return location;
}

export async function requestAndStoreUserLocation(): Promise<UserLocation> {
  try {
    const position = await getCurrentPosition();
    const coords = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
    const city = await getCityByCoords(coords.lat, coords.lon);

    const location = { city, coords };
    userLocationStorage.setLocation(location);
    notifyUserLocationUpdated();

    return location;
  } catch {
    // Геолокация браузера недоступна/запрещена (частый случай на мобильных) — пробуем по IP.
    const ipLocation = await getLocationByIP();
    const location = ipLocation ?? { city: null, coords: null };
    userLocationStorage.setLocation(location);
    notifyUserLocationUpdated();

    return location;
  }
}
