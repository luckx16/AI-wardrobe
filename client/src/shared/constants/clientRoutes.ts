// Маршрутизация по префиксам клиента
export const CLIENT_ROUTES = {
  HOME: '/',
  SIGN_UP: '/sign-up',
  SIGN_IN: '/sign-in',
  PROFILE: '/profile',
  WARDROBE: '/wardrobe',
  POSTS: '/posts',
  OUTFIT_BUILDER: '/outfit-builder',
  /** Детальная страница поста */
  POST_DETAIL: (id: number | string) => `/posts/${id}`,
  SIGN_OUT: '/sign-out',
} as const;
