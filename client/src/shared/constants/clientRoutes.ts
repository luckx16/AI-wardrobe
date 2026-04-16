// Маршрутизация по префиксам клиента
export const CLIENT_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  POSTS: '/posts',
  OUTFIT_BUILDER: '/outfit-builder',
  /** Детальная страница поста */
  POST_DETAIL: (id: number | string) => `/posts/${id}`,
  SIGN_OUT: '/sign-out',
} as const;
