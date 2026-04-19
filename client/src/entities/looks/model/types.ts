export interface ILook {
  id: number;
  userId: number;
  title: string;
  date: string;
  activity_type: string | null;
  lookId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ILookDataFromClient {
  title: string;
  date: string;
  activity_type?: string;
}

export type ArrayLooksType = Array<ILook>;
