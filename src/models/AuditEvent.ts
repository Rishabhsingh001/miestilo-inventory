import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditEvent extends Document {
  actorUserId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  requestId?: string;
  beforeSummary?: Record<string, unknown>;
  afterSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    actorUserId: { type: String },
    actorName: { type: String },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
    requestId: { type: String },
    beforeSummary: { type: Schema.Types.Mixed },
    afterSummary: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditEventSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditEventSchema.index({ actorUserId: 1, timestamp: -1 });
AuditEventSchema.index({ timestamp: -1 });

export const AuditEvent = mongoose.models.AuditEvent || mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
