// Тип для ответа от сервера
export type ServerResponseType<T = null> = {
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};
