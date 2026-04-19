// Маршрутизация по префиксам клиента
export const CLIENT_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  WARDROBE: '/wardrobe',
  LOOK_BUILDER: (id?: string) => `/look-builder/${id ?? 'generate-new'}`,
  SIGN_OUT: '/sign-out',
  EVENTS: '/events',
  LOOKS: '/looks',
  AI: '/ai',
} as const;
