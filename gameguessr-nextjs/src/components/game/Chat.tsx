import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/gameStore';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  roomCode: string;
  onSendMessage: (message: string) => void;
}

const Chat = memo(({ roomCode, onSendMessage }: ChatProps) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useStore((state) => state.messages);
  const isActive = useStore((state) => state.isChatActive);

  // Auto-scroll à chaque nouveau message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gestion mémoïsée de l'envoi de message
  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  }, [message, onSendMessage]);

  // Gestion mémoïsée de la touche Entrée
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isActive) return null;

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg: ChatMessage, index: number) => (
          <div key={`${msg.userId}-${msg.timestamp}-${index}`} className="message">
            <span className="username">{msg.username}: </span>
            <span className="text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Écrivez un message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSendMessage}>Envoyer</button>
      </div>
    </div>
  );
});

Chat.displayName = 'Chat';

export default Chat;
