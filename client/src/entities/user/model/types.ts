// Типы данных для авторизации
export interface ISignInData {
  email: string;
  password: string;
}

// Типы данных для регистрации
export interface ISignUpData {
  name: string;
  email: string;
  password: string;
}

// Тип для пользователя
export type UserType = {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

// Тип для пользователя с токеном
export type UserWithTokenType = {
  user: UserType;
  accessToken: string;
};
