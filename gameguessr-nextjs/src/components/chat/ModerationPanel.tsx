'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  UserX, 
  UserCheck, 
  MessageSquare,
  Eye,
  ChevronDown,
  Ban,
  Flag
} from 'lucide-react';
import { useGameActions, UserModerationStatus, ModerationReport } from '@/store/gameStore';
import Button from '@/components/ui/Button';

interface ModerationPanelProps {
  roomCode: string;
  currentUserId: string;
  isVisible: boolean;
  onClose: () => void;
  userStatuses: Record<string, UserModerationStatus>;
  reports: ModerationReport[];
}

export default function ModerationPanel({
  roomCode,
  currentUserId,
  isVisible,
  onClose,
  userStatuses,
  reports
}: ModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'actions'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState(5);

  const {
    warnUser,
    muteUser,
    blockUser,
    unmuteUser,
    unblockUser,
    reviewReport,
    addSystemMessage
  } = useGameActions();

  const handleUserAction = (action: 'warn' | 'mute' | 'block' | 'unmute' | 'unblock', targetUserId: string) => {
    if (!targetUserId || targetUserId === currentUserId) return;

    const targetUser = userStatuses[targetUserId];
    const userName = targetUser?.userName || 'Utilisateur inconnu';

    switch (action) {
      case 'warn':
        warnUser(roomCode, targetUserId, currentUserId, actionReason || 'Avertissement admin');
        break;
      case 'mute':
        muteUser(roomCode, targetUserId, currentUserId, actionDuration, actionReason || 'Muté par un admin');
        break;
      case 'block':
        blockUser(roomCode, targetUserId, currentUserId, actionDuration, actionReason || 'Bloqué par un admin');
        break;
      case 'unmute':
        unmuteUser(roomCode, targetUserId, currentUserId);
        break;
      case 'unblock':
        unblockUser(roomCode, targetUserId, currentUserId);
        break;
    }

    setActionReason('');
    setSelectedUserId(null);
  };

  const handleReportReview = (reportId: string, decision: 'approved' | 'dismissed') => {
    reviewReport(roomCode, reportId, currentUserId, decision, 'Examiné par admin');
  };

  const pendingReports = reports.filter(report => report.status === 'pending');
  const problemUsers = Object.values(userStatuses).filter(user => 
    user.warningCount > 0 || user.isMuted || user.isBlocked || user.violations.length > 0
  );

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Panneau de Modération</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'users', label: 'Utilisateurs', icon: UserX, count: problemUsers.length },
              { id: 'reports', label: 'Signalements', icon: Flag, count: pendingReports.length },
              { id: 'actions', label: 'Actions Rapides', icon: Shield, count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Utilisateurs à problèmes ({problemUsers.length})
                </h3>
                
                {problemUsers.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <p>Aucun utilisateur à problème détecté</p>
                  </div>
                ) : (
                  problemUsers.map((user) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {user.userName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{user.userName}</h4>
                            <div className="flex items-center space-x-4 text-sm text-white/60">
                              <span>⚠️ {user.warningCount} avertissements</span>
                              <span>📝 {user.violations.length} infractions</span>
                              {user.isMuted && <span className="text-yellow-400">🔇 Muté</span>}
                              {user.isBlocked && <span className="text-red-400">🚫 Bloqué</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!user.isMuted ? (
                            <Button
                              onClick={() => setSelectedUserId(user.userId)}
                              className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700"
                            >
                              <VolumeX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUserAction('unmute', user.userId)}
                              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700"
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {!user.isBlocked ? (
                            <Button
                              onClick={() => setSelectedUserId(user.userId)}
                              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleUserAction('unblock', user.userId)}
                              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {user.violations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <h5 className="text-sm font-medium text-white/80 mb-2">Dernières infractions:</h5>
                          <div className="space-y-1">
                            {user.violations.slice(-3).map((violation, index) => (
                              <div key={index} className="text-xs text-white/60">
                                • {violation.reason} ({violation.action})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Signalements en attente ({pendingReports.length})
                </h3>
                
                {pendingReports.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <Flag className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <p>Aucun signalement en attente</p>
                  </div>
                ) : (
                  pendingReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-white">{report.reporterName}</span>
                            <span className="text-white/60 text-sm">a signalé</span>
                            <span className="text-sm font-medium text-white">{report.targetUserName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              report.category === 'spam' ? 'bg-yellow-600' :
                              report.category === 'harassment' ? 'bg-red-600' :
                              report.category === 'inappropriate' ? 'bg-orange-600' :
                              'bg-gray-600'
                            }`}>
                              {report.category}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm mb-2">{report.reason}</p>
                          <p className="text-white/60 text-xs">
                            {report.timestamp.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handleReportReview(report.id, 'dismissed')}
                            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700"
                          >
                            Rejeter
                          </Button>
                          <Button
                            onClick={() => handleReportReview(report.id, 'approved')}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700"
                          >
                            Approuver
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Actions Rapides</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => addSystemMessage(roomCode, '📢 Merci de respecter les règles du chat', 'announcement')}
                    className="p-4 bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Rappel des règles</span>
                  </Button>
                  
                  <Button
                    onClick={() => addSystemMessage(roomCode, '🔇 Le chat est temporairement surveillé', 'warning')}
                    className="p-4 bg-yellow-600 hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Mode surveillance</span>
                  </Button>
                  
                  <Button
                    onClick={() => addSystemMessage(roomCode, '🧹 Nettoyage du chat en cours...', 'announcement')}
                    className="p-4 bg-purple-600 hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span>Nettoyer le chat</span>
                  </Button>
                  
                  <Button
                    onClick={() => addSystemMessage(roomCode, '✅ Le chat est de nouveau normal', 'announcement')}
                    className="p-4 bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>Mode normal</span>
                  </Button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white font-medium mb-3">Commandes Admin Disponibles</h4>
                  <div className="space-y-2 text-sm text-white/80">
                    <div><code className="bg-white/10 px-2 py-1 rounded">/warn [utilisateur] [raison]</code> - Avertir un utilisateur</div>
                    <div><code className="bg-white/10 px-2 py-1 rounded">/mute [utilisateur] [minutes] [raison]</code> - Muter un utilisateur</div>
                    <div><code className="bg-white/10 px-2 py-1 rounded">/block [utilisateur] [minutes] [raison]</code> - Bloquer un utilisateur</div>
                    <div><code className="bg-white/10 px-2 py-1 rounded">/unmute [utilisateur]</code> - Démuter un utilisateur</div>
                    <div><code className="bg-white/10 px-2 py-1 rounded">/unblock [utilisateur]</code> - Débloquer un utilisateur</div>
                    <div><code className="bg-white/10 px-2 py-1 rounded">/clear</code> - Nettoyer le chat</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Modal */}
          <AnimatePresence>
            {selectedUserId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Action de modération</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Raison</label>
                      <input
                        type="text"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Raison de l'action..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Durée (minutes)</label>
                      <input
                        type="number"
                        value={actionDuration}
                        onChange={(e) => setActionDuration(parseInt(e.target.value) || 5)}
                        min="1"
                        max="1440"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => handleUserAction('warn', selectedUserId)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        Avertir
                      </Button>
                      <Button
                        onClick={() => handleUserAction('mute', selectedUserId)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Muter
                      </Button>
                      <Button
                        onClick={() => handleUserAction('block', selectedUserId)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Bloquer
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedUserId(null)}
                      className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                      Annuler
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
