import { isAxiosError } from 'axios';

export type LoggableHttpError = {
  name: string;
  message: string;
  code?: string;
  status?: number;
  method?: string;
  url?: string;
  response?: unknown;
};

export function toLoggableHttpError(error: unknown): LoggableHttpError {
  if (isAxiosError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      method: error.config?.method,
      url: error.config?.url,
      response: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}
