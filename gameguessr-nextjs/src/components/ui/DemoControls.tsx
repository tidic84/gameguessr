'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Room, User, RoomUser } from '@/types';
import Button from '@/components/ui/Button';

export default function DemoControls() {
  const { setCurrentRoom, setUser } = useGameStore();

  const createDemoRoom = () => {
    // Créer un utilisateur demo
    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Joueur Demo',
      points: 150
    };

    // Créer une room demo
    const demoRoom: Room = {
      code: 'DEMO',
      name: 'Partie Demo',
      owner: 'demo-user-1',
      mode: 'classic',
      difficulty: 'medium',
      duration: 60,
      privacy: 'public',
      gameState: 'playing',
      gameDB: [],
      gameData: {
        images: [
          { url: '/images/cp1.jpg', id: 'image1' },
          { url: '/images/cp2.jpg', id: 'image2' },
          { url: '/images/cp3.jpg', id: 'image3' },
        ],
        currentIndex: 0
      },
      users: {
        'demo-user-1': {
          name: 'Joueur Demo',
          points: 150,
          role: 'admin',
          status: true,
          alive: true
        } as RoomUser,
        'demo-user-2': {
          name: 'Alice',
          points: 200,
          role: 'player',
          status: true,
          alive: true
        } as RoomUser,
        'demo-user-3': {
          name: 'Bob',
          points: 80,
          role: 'player',
          status: true,
          alive: true
        } as RoomUser,
        'demo-user-4': {
          name: 'Charlie',
          points: 120,
          role: 'player',
          status: false,
          alive: false
        } as RoomUser
      }
    };

    setUser(demoUser);
    setCurrentRoom(demoRoom);
  };

  const resetDemo = () => {
    setCurrentRoom(null);
    setUser(null);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <Button 
        onClick={createDemoRoom}
        className="bg-green-600 hover:bg-green-700"
      >
        🎮 Demo Jeu
      </Button>
      <Button 
        onClick={resetDemo}
        variant="ghost"
        className="bg-red-600 hover:bg-red-700"
      >
        🔄 Reset
      </Button>
    </div>
  );
}
