export interface IEvent {
  id: number;
  userId: number;
  title: string;
  date: string;
  activity_type: string | null;
  lookId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDataFromClient {
  title: string;
  date: string;
  activity_type?: string;
}

export type ArrayEventsType = Array<IEvent>;
