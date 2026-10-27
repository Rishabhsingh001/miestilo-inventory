import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET(req: NextRequest) {
  try {
    const startTime = Date.now();
    await connectToDatabase();
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
    }, {
      status: dbStatus === 'connected' ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    }, {
      status: 500,
    });
  }
}
