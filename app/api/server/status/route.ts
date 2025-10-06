import { NextResponse } from 'next/server';
import { getServerStatus } from '@/lib/db';

export async function GET() {
  try {
    const serverStatus = await getServerStatus();

    if (!serverStatus) {
      return NextResponse.json(
        { error: 'Server status unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(serverStatus);
  } catch (error) {
    console.error('Error fetching server status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server status' },
      { status: 500 }
    );
  }
}
