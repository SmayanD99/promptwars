import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for Cloud Run and monitoring.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'bridgeai',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200 }
  );
}
