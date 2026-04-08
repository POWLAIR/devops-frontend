import { type NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL } from '@/lib/constants';

export async function GET(_request: NextRequest) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/tenants/public`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }
    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
