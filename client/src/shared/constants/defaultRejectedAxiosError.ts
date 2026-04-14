import { ServerResponseType } from '../types';

export const defaultRejectedAxiosError: ServerResponseType = {
  statusCode: 503,
  message: 'Unknown internal server error',
  data: null,
  error: 'Network Error',
};
