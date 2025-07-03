import { NextRequest, NextResponse } from 'next/server';
import { validateRoomCode } from '@/utils/gameUtils';

export async function POST(request: NextRequest) {
  try {
    const { roomCode } = await request.json();
    
    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Code de room requis' },
        { status: 400 }
      );
    }

    const isValid = validateRoomCode(roomCode);
    
    return NextResponse.json({
      valid: isValid,
      error: isValid ? null : 'Code de room invalide (6 caractères alphanumériques)'
    });
  } catch (error) {
    console.error('Erreur lors de la validation du code room:', error);
    return NextResponse.json(
      { valid: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
