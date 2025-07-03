import { v4 as uuidv4 } from 'uuid';

// Générer un ID utilisateur unique
export const generateUserId = (): string => {
  return uuidv4();
};

// Générer un code de room aléatoire
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Valider un nom d'utilisateur
export const validateUsername = (username: string): boolean => {
  return username.trim().length >= 2 && username.trim().length <= 20;
};

// Valider un code de room
export const validateRoomCode = (code: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(code);
};

// Calculer la distance entre deux points
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculer les points basés sur la distance
export const calculateMapPoints = (distance: number, maxDistance: number = 1000): number => {
  if (distance <= 50) return 100;
  if (distance <= 100) return 90;
  if (distance <= 200) return 80;
  if (distance <= 300) return 70;
  if (distance <= 400) return 60;
  if (distance <= 500) return 50;
  if (distance <= 600) return 40;
  if (distance <= 700) return 30;
  if (distance <= 800) return 20;
  if (distance <= 900) return 10;
  return 0;
};

// Formater le temps (en secondes) en MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Obtenir la couleur selon le classement
export const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'text-yellow-500'; // Or
    case 2:
      return 'text-gray-400'; // Argent
    case 3:
      return 'text-amber-600'; // Bronze
    default:
      return 'text-gray-600';
  }
};

// Trier les utilisateurs par points
export const sortUsersByPoints = (users: Record<string, any>): [string, any][] => {
  return Object.entries(users).sort(([, a], [, b]) => b.points - a.points);
};
