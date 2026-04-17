const USER_CITY_KEY = 'user_city';
const USER_COORDS_KEY = 'user_coords';

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
  setLocation(location: UserLocation): void {
    if (location.city) {
      this.setCity(location.city);
    }
    if (location.coords) {
      this.setCoords(location.coords);
    }
  },
};

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
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
    );
    const data = (await response.json()) as NominatimResponse;

    return data.address?.city || data.address?.town || data.address?.village || data.address?.state || null;
  } catch {
    return null;
  }
}

export async function requestAndStoreUserLocation(): Promise<UserLocation> {
  const position = await getCurrentPosition();
  const coords = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };
  const city = await getCityByCoords(coords.lat, coords.lon);

  const location = { city, coords };
  userLocationStorage.setLocation(location);

  return location;
}
