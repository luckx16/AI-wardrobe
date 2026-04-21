export const WARDROBE_API_ROUTES = {
  CLOTHES: '/cloth',
  CLOTH: (clothId: string) => `/cloth/${clothId}`,
  CLOTH_STATUS: (clothId: string) => `/cloth/${clothId}/status`,
} as const;
