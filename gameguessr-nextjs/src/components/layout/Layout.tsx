import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AnimatedContainer } from '@/components/ui/AnimatedElements';
import Navigation from '@/components/navigation/Navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'GameGuessr' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col">
      <Navigation title={title} />
      
      <AnimatedContainer 
        className="container mx-auto px-4 py-8 flex-grow"
        animation="fade"
      >
        {children}
      </AnimatedContainer>
      
      <AnimatedContainer
        className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto"
        animation="slideUp"
      >
        <div className="container mx-auto px-4 py-4 text-center text-white/70">
          <p>&copy; 2025 GameGuessr - Devinez les jeux à partir d'images 360°</p>
        </div>
      </AnimatedContainer>
    </div>
  );
}
