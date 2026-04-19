export const LOOK_API_ROUTES = {
  LOOKS: '/looks',
  LOOK: (id: number) => `/looks/${id}`,
} as const;
