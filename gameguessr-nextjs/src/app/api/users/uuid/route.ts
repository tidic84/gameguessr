import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const uuid = uuidv4();
    return NextResponse.json({ uuid });
  } catch (error) {
    console.error('Erreur lors de la génération UUID:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
