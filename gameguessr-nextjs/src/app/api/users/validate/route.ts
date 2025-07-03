import { NextRequest, NextResponse } from 'next/server';
import { validateUsername } from '@/utils/gameUtils';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Nom d\'utilisateur requis' },
        { status: 400 }
      );
    }

    const isValid = validateUsername(username);
    
    return NextResponse.json({
      valid: isValid,
      error: isValid ? null : 'Nom d\'utilisateur invalide (2-20 caractères)'
    });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return NextResponse.json(
      { valid: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
