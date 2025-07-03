'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Popup from '@/components/ui/Popup';
import { Bell, MessageCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AnimationExamples() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'>('bottom-right');
  const { addNotification, notifySystemEvent, notifyGameEvent, notifyNewMessage } = useNotifications();

  const showNotification = (type: 'message' | 'system' | 'game') => {
    const notificationContent = {
      message: {
        title: 'Nouveau message',
        content: 'Vous avez reçu un nouveau message dans le chat.',
        icon: <MessageCircle />
      },
      system: {
        title: 'Mise à jour système',
        content: 'Une nouvelle mise à jour est disponible pour le jeu.',
        icon: <Bell />
      },
      game: {
        title: 'Événement de jeu',
        content: 'Une nouvelle partie vient de commencer dans votre salle.',
        icon: <Info />
      }
    };

    switch (type) {
      case 'message':
        notifyNewMessage('John Doe', notificationContent.message.content);
        break;
      case 'system':
        notifySystemEvent(notificationContent.system.title, notificationContent.system.content);
        break;
      case 'game':
        notifyGameEvent(notificationContent.game.title, notificationContent.game.content);
        break;
    }
  };

  const showPopup = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center') => {
    setPopupPosition(position);
    setPopupOpen(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">Exemples d'animations UI</h1>
      
      <section className="mb-12 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold mb-4 text-white">Tooltips</h2>
        <div className="flex flex-wrap gap-4">
          <Tooltip content="Tooltip positionné en haut" position="top">
            <Button>Hover (Top)</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip positionné en bas" position="bottom">
            <Button>Hover (Bottom)</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip positionné à gauche" position="left">
            <Button>Hover (Left)</Button>
          </Tooltip>
          
          <Tooltip content="Tooltip positionné à droite" position="right">
            <Button>Hover (Right)</Button>
          </Tooltip>
          
          <Tooltip 
            content={
              <div className="max-w-[200px]">
                <h4 className="font-semibold text-white mb-1">Tooltip avec contenu riche</h4>
                <p className="text-sm text-white/80">Les tooltips peuvent contenir du texte formaté, des icônes et plus encore.</p>
              </div>
            }
            position="bottom"
          >
            <Button variant="primary">Contenu riche</Button>
          </Tooltip>
        </div>
      </section>
      
      <section className="mb-12 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold mb-4 text-white">Popups</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <Button onClick={() => showPopup('top-right')}>Popup (Top Right)</Button>
          <Button onClick={() => showPopup('top-left')}>Popup (Top Left)</Button>
          <Button onClick={() => showPopup('bottom-right')}>Popup (Bottom Right)</Button>
          <Button onClick={() => showPopup('bottom-left')}>Popup (Bottom Left)</Button>
          <Button onClick={() => showPopup('center')}>Popup (Center)</Button>
        </div>
        
        <Popup
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
          position={popupPosition}
          showCloseButton={true}
          autoClose={true}
          autoCloseDelay={5000}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Popup d'information</h3>
            </div>
            <p className="text-sm text-white/80">
              Voici un exemple de popup avec fermeture automatique.
              La barre de progression indique le temps restant.
            </p>
          </div>
        </Popup>
      </section>
      
      <section className="mb-12 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
        <h2 className="text-xl font-semibold mb-4 text-white">Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={() => showNotification('message')}
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            Notification de message
          </Button>
          
          <Button 
            onClick={() => showNotification('system')}
            leftIcon={<Bell className="w-4 h-4" />}
          >
            Notification système
          </Button>
          
          <Button 
            onClick={() => showNotification('game')}
            leftIcon={<Info className="w-4 h-4" />}
          >
            Notification de jeu
          </Button>
          
          <Button 
            onClick={() => addNotification({
              type: 'error',
              title: 'Erreur',
              content: 'Une erreur est survenue lors de la connexion au serveur.',
              autoClose: true,
              duration: 5000
            })}
            leftIcon={<AlertTriangle className="w-4 h-4" />}
            variant="danger"
          >
            Notification d'erreur
          </Button>
          
          <Button 
            onClick={() => addNotification({
              type: 'success',
              title: 'Succès',
              content: 'Votre profil a été mis à jour avec succès !',
              autoClose: true,
              duration: 5000
            })}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            variant="success"
          >
            Notification de succès
          </Button>
        </div>
      </section>
    </div>
  );
}
