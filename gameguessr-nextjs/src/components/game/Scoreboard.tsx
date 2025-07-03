'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { useCurrentRoom } from '@/store/gameStore';

interface ScoreboardProps {
  className?: string;
}

export default function Scoreboard({ className = '' }: ScoreboardProps) {
  const currentRoom = useCurrentRoom();

  if (!currentRoom) {
    return null;
  }

  const players = currentRoom.users || [];

  return (
    <motion.div 
      className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Classement</h3>
      </div>

      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="text-center text-white/60 py-4">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p>Aucun joueur connecté</p>
          </div>
        ) : (
          players.map((player, index) => (
            <motion.div
              key={player.id}
              className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-sm font-bold text-white/80">
                #{index + 1}
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {player.username.slice(0, 1).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="text-white font-medium">{player.username}</div>
                <div className="text-white/60 text-sm">0 points</div>
              </div>
              
              {player.isAdmin && (
                <div className="px-2 py-1 bg-red-600/20 rounded text-red-400 text-xs">
                  Admin
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}