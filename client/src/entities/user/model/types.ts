// Типы данных для авторизации
export interface ISignInData {
  email: string;
  password: string;
}

// Типы данных для регистрации
export interface ISignUpData extends ISignInData {
  name: string;
}

// Тип для пользователя
export type UserType = {
  id: number;
  email: string;
  name: string;
  surname?: string | null;
  age?: number | null;
  telephone?: string | null;
  verified?: boolean;
  password?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Тип для пользователя с токеном
export type UserWithTokenType = {
  user: UserType;
  accessToken: string;
};
