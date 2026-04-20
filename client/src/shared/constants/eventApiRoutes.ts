export const EVENT_API_ROUTES = {
  EVENTS: '/events',
  EVENT: (id: number) => `/events/${id}`,
} as const;
