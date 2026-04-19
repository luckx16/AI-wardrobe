export const WARDROBE_API_ROUTES = {
  CLOTHES: '/cloth',
  CLOTH: (clothId: string) => `/cloth/${clothId}`,
  
} as const;
