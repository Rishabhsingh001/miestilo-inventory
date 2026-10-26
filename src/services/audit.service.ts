import { AuditEvent } from '@/models/AuditEvent';
import { connectToDatabase } from '@/lib/db/connection';

export interface LogAuditParams {
  actorUserId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    await connectToDatabase();
    // Redact any sensitive fields from summaries (passwords, tokens)
    const sanitizedBefore = params.beforeSummary ? sanitizeSummary(params.beforeSummary) : undefined;
    const sanitizedAfter = params.afterSummary ? sanitizeSummary(params.afterSummary) : undefined;

    await AuditEvent.create({
      ...params,
      beforeSummary: sanitizedBefore,
      afterSummary: sanitizedAfter,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Audit Log Failure]', error);
  }
}

function sanitizeSummary(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'auth'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
