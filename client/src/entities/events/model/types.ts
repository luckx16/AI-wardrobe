import { ILook } from '@/entities/look';

export interface IEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  activity_type: string | null;
  look_id: string;
  look: ILook;
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
