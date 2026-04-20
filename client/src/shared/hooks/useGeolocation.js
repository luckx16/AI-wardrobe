import { useEffect, useState } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState({
    city: null,
    lat: null,
    lon: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectLocation = async () => {
      // 1. Сначала пробуем получить точные координаты через браузер
      if (!navigator.geolocation) {
        // Если браузер не поддерживает геолокацию - используем IP
        await getCityByIP();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Получаем город по координатам
          await getCityByCoords(latitude, longitude);
        },
        async (error) => {
          console.warn('Geolocation error:', error.message);
          // Если пользователь отказал или ошибка - используем IP
          await getCityByIP();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    };

    // Получение города по координатам (обратный геокодинг)
    const getCityByCoords = async (lat, lon) => {
      try {
        // Используем Open-Meteo для обратного геокодинга (бесплатно, без ключа)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`,
        );

        // Альтернатива: Nominatim (OpenStreetMap)
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        );
        const geoData = await geoResponse.json();

        const city =
          geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown';

        setLocation({
          city: city,
          lat: lat,
          lon: lon,
          loading: false,
          error: null,
        });

        // Сохраняем в localStorage
        localStorage.setItem('user_city', city);
        localStorage.setItem('user_coords', JSON.stringify({ lat, lon }));
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        await getCityByIP(); // fallback
      }
    };

    // Получение города по IP (запасной вариант)
    const getCityByIP = async () => {
      try {
        // Бесплатный сервис определения города по IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const city = data.city || data.region || 'Unknown';

        setLocation({
          city: city,
          lat: data.latitude,
          lon: data.longitude,
          loading: false,
          error: null,
        });

        localStorage.setItem('user_city', city);
      } catch (error) {
        console.error('IP geolocation error:', error);
        setLocation({
          city: null,
          lat: null,
          lon: null,
          loading: false,
          error: 'Failed to detect location',
        });
      }
    };

    // Проверяем, есть ли сохраненный город
    const savedCity = localStorage.getItem('user_city');
    if (savedCity) {
      setLocation({
        city: savedCity,
        lat: null,
        lon: null,
        loading: false,
        error: null,
      });
    } else {
      detectLocation();
    }
  }, []);

  return location;
};
