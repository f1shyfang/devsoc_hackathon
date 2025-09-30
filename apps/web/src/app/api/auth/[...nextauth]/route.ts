import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    { error: 'Authentication is disabled' },
    { status: 404 }
  );
}

export function POST() {
  return NextResponse.json(
    { error: 'Authentication is disabled' },
    { status: 404 }
  );
}


