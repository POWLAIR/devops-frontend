import { NextResponse } from 'next/server';

export async function POST() {
  // La déconnexion est gérée côté client (suppression du token)
  // Cette route existe pour la cohérence de l'API
  return NextResponse.json({ message: 'Déconnexion réussie' }, { status: 200 });
}

