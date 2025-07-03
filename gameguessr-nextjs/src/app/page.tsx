'use client';

import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DemoControls from '@/components/ui/DemoControls';
import PageTransition from '@/components/transitions/PageTransition';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { generateUserId, validateUsername, validateRoomCode } from '@/utils/gameUtils';
import { motion } from 'framer-motion';

export default function Home() {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  const handleCreateRoom = () => {
    if (!validateUsername(username)) {
      alert('Nom d\'utilisateur invalide (2-20 caractères)');
      return;
    }
    
    const userId = generateUserId();
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    if (!validateUsername(username)) {
      alert('Nom d\'utilisateur invalide (2-20 caractères)');
      return;
    }
    
    if (!validateRoomCode(roomCode)) {
      alert('Code de partie invalide');
      return;
    }
    
    const userId = generateUserId();
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    router.push(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <Layout title="GameGuessr">
      <PageTransition pageKey={pathname || 'home'}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8">
            <motion.div 
              className="text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2">GameGuessr</h1>
              <p className="text-white/70 text-lg">
                Devinez où les photos ont été prises !
              </p>
            </motion.div>

            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                    Nom d'utilisateur
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Entrez votre nom"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateRoom}
                  disabled={!username.trim()}
                >
                  Créer une partie
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/70">ou</span>
                  </div>
                </div>

                <Input
                  type="text"
                  placeholder="Code de la partie"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleJoinRoom}
                  disabled={!username.trim() || !roomCode.trim()}
                >
                  Rejoindre une partie
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Contrôles de démo pour les tests */}
        <DemoControls />
      </PageTransition>
    </Layout>
  );
}
