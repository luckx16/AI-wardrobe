export const LOOK_API_ROUTES = {
  LOOKS: '/looks',
  LOOK: (id: string) => `/looks/${id}`,
  LOOK_LIKE: (id: string) => `/looks/like/${id}`,
} as const;
