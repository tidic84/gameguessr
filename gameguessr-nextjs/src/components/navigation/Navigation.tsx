'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLink, AnimatedContainer } from '@/components/ui/AnimatedElements';
import Button from '@/components/ui/Button';
import { useAnimation } from '@/store/gameStore';

interface NavigationProps {
  title?: string;
  showBackButton?: boolean;
}

export default function Navigation({ title = 'GameGuessr', showBackButton = false }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { trigger } = useAnimation('navigationAnimation');
  
  const handleBackToHome = () => {
    trigger();
    router.push('/');
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const menuItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Créer une partie', path: '/create-room' },
    { label: 'À propos', path: '/about' },
  ];
  
  return (
    <div className="relative">
      <AnimatedContainer 
        className="bg-black/20 backdrop-blur-md border-b border-white/10 py-4"
        animation="slideUp"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo / Titre */}
          <h1 
            className="text-2xl font-bold text-white cursor-pointer hover:text-blue-300 transition-colors"
            onClick={handleBackToHome}
          >
            {title}
          </h1>
          
          {/* Menu sur mobile */}
          <div className="block md:hidden">
            <Button 
              variant="ghost"
              onClick={toggleMenu}
              className="p-2"
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
          
          {/* Menu sur desktop */}
          <div className="hidden md:flex space-x-6 items-center">
            {menuItems.map((item) => (
              <AnimatedLink
                key={item.path}
                className="text-white hover:text-blue-300 transition-colors"
                onClick={() => {
                  trigger();
                  router.push(item.path);
                }}
                isActive={pathname === item.path}
              >
                {item.label}
              </AnimatedLink>
            ))}
          </div>
        </div>
      </AnimatedContainer>
      
      {/* Menu mobile déroulant */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 backdrop-blur-md border-b border-white/10 overflow-hidden md:hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {menuItems.map((item) => (
                <motion.div
                  key={item.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className={`text-left w-full py-2 px-4 rounded-md transition-colors ${
                      pathname === item.path
                        ? 'bg-blue-600 text-white'
                        : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      trigger();
                      router.push(item.path);
                    }}
                  >
                    {item.label}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
