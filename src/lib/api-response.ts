import { NextResponse } from 'next/server';

export interface StandardApiResponse<T = unknown, M = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: M;
}

/**
 * Standard API Success Response
 * Shape: { success: true, message: string, data: T, meta?: M }
 */
export function apiSuccess<T = unknown, M = unknown>(
  data: T,
  message = 'Success',
  meta?: M,
  status = 200
) {
  const body: StandardApiResponse<T, M> = {
    success: true,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  };

  return NextResponse.json(body, { status });
}

/**
 * Standard API Error Response
 * Shape: { success: false, message: string, data: null, meta?: M }
 */
export function apiError<M = unknown>(
  message: string,
  status = 400,
  data: unknown = null,
  meta?: M
) {
  const body: StandardApiResponse<unknown, M> = {
    success: false,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  };

  return NextResponse.json(body, { status });
}
