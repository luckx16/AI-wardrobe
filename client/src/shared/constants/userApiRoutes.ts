// Маршрутизация по префиксам API для пользователей
export const USER_API_ROUTES = {
  REFRESH_TOKENS: '/tokens/refresh',
  SIGN_UP: '/auth/signUp',
  SIGN_IN: '/auth/signIn',
  SIGN_OUT: '/auth/signOut',
  DELETE_USER: '/users',
  WEATHER: '/weather',
  WEATHER_BY_COORDS: '/weather/coords',
} as const;
