export interface StyleEvent {
  id: number;
  userId: number;
  title: string;
  date: string;
  activityType: string | null;
  lookId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventFromClient {
  title: string;
  date: string;
  activityType?: string;
}
