export interface IEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  activity_type: string | null;
  lookId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventDataFromClient {
  title: string;
  date: string;
  activity_type: string;
  look_id: string;
}

export type ArrayEventsType = Array<IEvent>;
