export const EVENT_API_ROUTES = {
  EVENTS: '/events',
  EVENT: (id: string) => `/events/${id}`,
} as const;
