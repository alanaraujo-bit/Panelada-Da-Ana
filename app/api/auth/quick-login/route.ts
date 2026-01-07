import { NextResponse } from 'next/server';

// Este endpoint foi desativado.
// O “login rápido” desejado é baseado em contas salvas no client.

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
