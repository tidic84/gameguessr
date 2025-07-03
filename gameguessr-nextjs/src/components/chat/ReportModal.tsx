'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, AlertTriangle } from 'lucide-react';
import { useGameActions, useGameStore } from '@/store/gameStore';
import { DURATIONS, EASINGS, modalAnimation, overlayAnimation } from '@/utils/animations';
import Button from '@/components/ui/Button';

interface ReportModalProps {
  roomCode: string;
  userId: string;
  userName: string;
  isVisible: boolean;
  onClose: () => void;
  targetUserId?: string | null;
  targetUserName?: string | null;
}

type ReportCategory = 'spam' | 'harassment' | 'inappropriate' | 'other';

export default function ReportModal({
  roomCode,
  userId,
  userName,
  isVisible,
  onClose,
  targetUserId,
  targetUserName
}: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory>('spam');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { addSystemMessage } = useGameActions();
  const reducedMotion = false; // Simplifié
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // Animation simplifiée
  }, [isVisible]);

  const handleSubmit = () => {
    if (!targetUserId || reason.trim() === '') {
      return;
    }

    // TODO: Implémenter reportUser
    console.log('Report user:', 
      roomCode,
      userId,
      targetUserId,
      'message-' + Date.now(), // ID du message (généré aléatoirement car nous n'avons pas de message spécifique)
      reason.trim(),
      category
    );

    // Ajouter un message système pour confirmer le signalement
    addSystemMessage(
      roomCode,
      `🚩 Votre signalement a été enregistré et sera examiné par un modérateur.`,
      'warning'
    );

    setSubmitted(true);
    
    // Réinitialiser le formulaire après soumission
    setTimeout(() => {
      setReason('');
      setCategory('spam');
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  if (!mounted || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayAnimation}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
          ease: EASINGS.smooth
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalAnimation}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
            ease: EASINGS.smooth
          }}
          className="bg-gray-900 rounded-xl border border-white/20 shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Flag className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-white">Signaler un problème</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
              aria-label="Fermer"
            >
              <span className="sr-only">Fermer</span>
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitted ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.3
                  }}
                >
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <motion.path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        duration: 0.5,
                        delay: 0.5
                      }} 
                    />
                  </svg>
                </motion.div>
                <motion.h3 
                  className="text-white font-medium text-lg mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Signalement envoyé !
                </motion.h3>
                <motion.p 
                  className="text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Merci d'avoir contribué à maintenir une communauté saine.
                </motion.p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {targetUserName && (
                  <motion.div 
                    className="flex items-center space-x-2 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-white/90 text-sm">
                      Vous êtes sur le point de signaler <span className="font-medium">{targetUserName}</span>
                    </p>
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Catégorie du signalement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'spam', label: 'Spam' },
                      { id: 'harassment', label: 'Harcèlement' },
                      { id: 'inappropriate', label: 'Contenu inapproprié' },
                      { id: 'other', label: 'Autre' }
                    ].map((option, index) => (
                      <motion.button
                        key={option.id}
                        type="button"
                        onClick={() => setCategory(option.id as ReportCategory)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          category === option.id
                            ? 'bg-yellow-500/20 border-yellow-500/50 border text-white'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: category === option.id ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.1)' 
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Détails (obligatoire)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Veuillez décrire le problème en détail..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 min-h-[100px] resize-none focus:border-blue-500 transition-colors"
                    required
                  />
                </motion.div>
                
                <motion.div 
                  className="pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={!reason.trim()}
                    className={`w-full ${!reason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    variant="primary"
                  >
                    Envoyer le signalement
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
