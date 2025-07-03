import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { GameData } from '@/types';

export async function GET() {
  try {
    const gameDataPath = join(process.cwd(), 'public/game.json');
    const gameData: GameData[] = JSON.parse(readFileSync(gameDataPath, 'utf-8'));
    
    return NextResponse.json({ gameData });
  } catch (error) {
    console.error('Erreur lors du chargement des données du jeu:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données du jeu' },
      { status: 500 }
    );
  }
}
