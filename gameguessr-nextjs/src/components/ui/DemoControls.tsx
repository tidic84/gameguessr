'use client';

import { useGameStore } from '@/store/gameStore';
import { Room, User } from '@/types';
import Button from '@/components/ui/Button';

export default function DemoControls() {
  const { setCurrentRoom, setUser } = useGameStore();

  const createDemoRoom = () => {
    // Créer un utilisateur demo
    const demoUser: User = {
      id: 'demo-user-1',
      username: 'Joueur Demo',
      isAuthenticated: true
    };

    // Créer une room demo
    const demoRoom: Room = {
      code: 'DEMO',
      name: 'Partie Demo',
      owner: 'demo-user-1',
      mode: 'classic',
      users: [demoUser]
    };

    setUser(demoUser);
    setCurrentRoom(demoRoom);
  };

  const resetDemo = () => {
    setCurrentRoom(null);
    setUser(null);
  };

  return (
    <div className="demo-controls p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Contrôles Demo</h3>
      <div className="space-x-2">
        <Button onClick={createDemoRoom} variant="primary">
          Créer Room Demo
        </Button>
        <Button onClick={resetDemo} variant="secondary">
          Reset Demo
        </Button>
      </div>
    </div>
  );
}