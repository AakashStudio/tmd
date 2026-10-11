import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success?: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Standard JSON success response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, any>,
  status: number = 200,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status, headers }
  );
}

/**
 * Standard JSON error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: any
) {
  return NextResponse.json(
    {
      error,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
    { status }
  );
}
