import { NextResponse } from 'next/server';
import { getServerStats } from '@/lib/db';

export async function GET() {
  try {
    const serverStats = await getServerStats();

    return NextResponse.json(serverStats);
  } catch (error) {
    console.error('Error fetching server stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server stats' },
      { status: 500 }
    );
  }
}
