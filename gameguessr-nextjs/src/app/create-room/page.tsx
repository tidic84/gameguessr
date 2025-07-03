'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageTransition from '@/components/transitions/PageTransition';
import { generateRoomCode } from '@/utils/gameUtils';
import { useSocket } from '@/hooks/useSocket';

export default function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [duration, setDuration] = useState(60);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { emit } = useSocket();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('Nom de la partie requis');
      return;
    }

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (!userId || !username) {
      router.push('/');
      return;
    }

    setIsCreating(true);

    try {
      const roomCode = generateRoomCode();
      
      // Rejoindre d'abord la room (le serveur gère la création de l'utilisateur automatiquement)
      emit.joinRoom(roomCode);
      
      // Rediriger vers la room
      setTimeout(() => {
        router.push(`/room/${roomCode}`);
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la création de la room:', error);
      alert('Erreur lors de la création de la partie');
      setIsCreating(false);
    }
  };

  return (
    <Layout title="Créer une partie">
      <PageTransition pageKey={pathname || 'create-room'}>
        <div className="max-w-md mx-auto">
          <motion.div 
            className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1 
              className="text-2xl font-bold text-white mb-6 text-center"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Créer une nouvelle partie
            </motion.h1>

            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                label="Nom de la partie"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ma partie GameGuessr"
                maxLength={50}
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Difficulté
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy" className="bg-gray-800">Facile</option>
                  <option value="normal" className="bg-gray-800">Normal</option>
                  <option value="hard" className="bg-gray-800">Difficile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Durée par image (secondes)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30} className="bg-gray-800">30 secondes</option>
                  <option value={60} className="bg-gray-800">1 minute</option>
                  <option value={120} className="bg-gray-800">2 minutes</option>
                  <option value={180} className="bg-gray-800">3 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Visibilité
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                      className="mr-2"
                    />
                    <span className="text-white">Publique</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                      className="mr-2"
                    />
                    <span className="text-white">Privée</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => router.push('/')}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateRoom}
                  disabled={isCreating || !roomName.trim()}
                >
                  {isCreating ? 'Création...' : 'Créer la partie'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  );
}
