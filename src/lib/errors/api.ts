import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiResponseMeta {
  requestId?: string;
  page?: number;
  pageSize?: number;
  total?: number;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function successResponse<T>(data: T, meta: ApiResponseMeta = {}, status = 200) {
  return NextResponse.json(
    {
      data,
      meta: {
        requestId: meta.requestId || generateRequestId(),
        ...meta,
      },
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details: unknown = []
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId: generateRequestId(),
      },
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof ZodError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Please review the highlighted fields.',
      422,
      error.issues
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  if (message.includes('INSUFFICIENT_STOCK')) {
    return errorResponse('INSUFFICIENT_STOCK', message, 400);
  }
  if (message.includes('NOT_FOUND')) {
    return errorResponse('NOT_FOUND', message, 404);
  }
  if (message.includes('FORBIDDEN') || message.includes('UNAUTHORIZED')) {
    return errorResponse('FORBIDDEN', message, 403);
  }
  if (message.includes('CONFLICT') || message.includes('E11000 duplicate key')) {
    return errorResponse('CONFLICT', message, 409);
  }

  return errorResponse('INTERNAL_SERVER_ERROR', message, 500);
}
