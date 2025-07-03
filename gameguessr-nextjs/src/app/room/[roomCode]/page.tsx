'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import GameLayout from '@/components/game/GameLayout';
import DemoControls from '@/components/ui/DemoControls';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore, useCurrentRoom, useUser } from '@/store/gameStore';

export default function RoomPage() {
  const params = useParams();
  const roomCode = params?.roomCode as string;
  const router = useRouter();
  const { emit, isConnected } = useSocket();
  const currentRoom = useCurrentRoom();
  const user = useUser();
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    if (!roomCode || Array.isArray(roomCode)) {
      router.push('/');
      return;
    }

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!userId || !username) {
      router.push('/');
      return;
    }

    if (isConnected) {
      // Rejoindre la room directement
      emit.joinRoom(roomCode);
      setIsJoining(false);
    }
  }, [roomCode, isConnected, emit, router]);

  const handleStartGame = () => {
    if (roomCode && typeof roomCode === 'string') {
      emit.startGame(roomCode);
    }
  };

  const handleLeaveRoom = () => {
    router.push('/');
  };

  if (isJoining) {
    return (
      <Layout title="Chargement...">
        <div className="text-center">
          <div className="text-white text-xl">Connexion à la partie...</div>
        </div>
      </Layout>
    );
  }

  if (!currentRoom) {
    return (
      <Layout title="Partie introuvable">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Partie introuvable</div>
          <Button onClick={() => router.push('/')}>Retour à l'accueil</Button>
        </div>
      </Layout>
    );
  }

  const players = currentRoom?.users || [];
  const isOwner = user?.id === currentRoom?.owner;
  const canStartGame = isOwner && players.length > 0 && currentRoom?.gameState?.status === 'waiting';

  // Si le jeu est en cours, afficher l'interface de jeu
  if (currentRoom?.gameState?.status === 'playing') {
    return <GameLayout roomCode={roomCode as string} />;
  }

  return (
    <Layout title={`Partie ${currentRoom.name}`}>
      <div className="max-w-4xl mx-auto">
        {/* En-tête de la room */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{currentRoom.name}</h1>
              <p className="text-white/70">Code: {roomCode}</p>
              <p className="text-white/70">
                État: {currentRoom?.gameState?.status === 'waiting' ? 'En attente' : 'En cours'}
              </p>
            </div>
            <div className="flex space-x-4">
              {canStartGame && (
                <Button onClick={handleStartGame}>
                  Démarrer la partie
                </Button>
              )}
              <Button variant="ghost" onClick={handleLeaveRoom}>
                Quitter
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des joueurs */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">
                Joueurs ({players.length})
              </h2>
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg bg-blue-500/20`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-green-500`} />
                      <span className="text-white font-medium">
                        {player.username}
                        {player.id === currentRoom?.owner && ' 👑'}
                      </span>
                    </div>
                    <span className="text-white/70 font-bold">
                      {currentRoom?.gameState?.scores?.[player.id] || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone de jeu / chat */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              {currentRoom?.gameState?.status === 'waiting' ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold text-white mb-4">
                    En attente du démarrage
                  </h3>
                  <p className="text-white/70 mb-6">
                    {isOwner
                      ? 'Cliquez sur "Démarrer la partie" pour commencer !'
                      : 'En attente que l\'organisateur démarre la partie...'}
                  </p>
                  <div className="text-white/50">
                    <p>Mode: {currentRoom.mode}</p>
                    <p>Joueurs: {players.length}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Jeu en cours !
                  </h3>
                  <p className="text-white/70">
                    État actuel: {currentRoom?.gameState?.status || 'En attente'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contrôles de démo pour les tests */}
      <DemoControls />
    </Layout>
  );
}
