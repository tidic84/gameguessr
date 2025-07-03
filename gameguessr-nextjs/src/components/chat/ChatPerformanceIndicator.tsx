'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Clock, Database, Zap } from 'lucide-react';
import { ChatPerformanceStats } from '@/store/gameStore';

interface ChatPerformanceIndicatorProps {
  stats: ChatPerformanceStats | null;
  isVisible: boolean;
  className?: string;
}

export default function ChatPerformanceIndicator({ 
  stats, 
  isVisible, 
  className = '' 
}: ChatPerformanceIndicatorProps) {
  if (!stats || !isVisible) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatCompressionRatio = (ratio: number): string => {
    const percentage = ((1 - 1/ratio) * 100);
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed bottom-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl text-xs text-white/80 ${className}`}
        >
          <div className="flex items-center space-x-1 mb-2">
            <BarChart3 className="w-3 h-3" />
            <span className="font-medium">Performance Chat</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-blue-400" />
                <span>Messages:</span>
              </div>
              <span className="font-mono">{stats.messageCount}</span>
            </div>
            
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-green-400" />
                <span>Mémoire:</span>
              </div>
              <span className="font-mono">{formatBytes(stats.memoryUsage)}</span>
            </div>
            
            {stats.compressionRatio > 1 && (
              <div className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span>Compression:</span>
                </div>
                <span className="font-mono">{formatCompressionRatio(stats.compressionRatio)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span>Nettoyage:</span>
              </div>
              <span className="font-mono text-xs">
                {stats.lastCleanup.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
