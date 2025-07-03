'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface GameInputProps {
  onSubmitAnswer: (answer: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  correctAnswers?: string[];
  className?: string;
}

export default function GameInput({
  onSubmitAnswer,
  disabled = false,
  placeholder = "Quel est ce jeu ?",
  suggestions = [],
  correctAnswers = [],
  className = ''
}: GameInputProps) {
  const [answer, setAnswer] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrer les suggestions basées sur la saisie
  useEffect(() => {
    if (answer.length >= 2) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(answer.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [answer, suggestions]);

  const handleSubmit = (submittedAnswer?: string) => {
    const finalAnswer = submittedAnswer || answer;
    if (finalAnswer.trim()) {
      onSubmitAnswer(finalAnswer.trim());
      setAnswer('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSubmit(filteredSuggestions[selectedSuggestionIndex]);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const isCorrectAnswer = (userAnswer: string): boolean => {
    return correctAnswers.some(correct => 
      correct.toLowerCase() === userAnswer.toLowerCase()
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          
          {/* Icône de validation si la réponse est correcte */}
          {answer && isCorrectAnswer(answer) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              ✓
            </div>
          )}
        </div>
        
        <Button
          onClick={() => handleSubmit()}
          disabled={disabled || !answer.trim()}
          className="px-6"
        >
          Valider
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-500/20 transition-colors ${
                index === selectedSuggestionIndex ? 'bg-blue-500/30' : ''
              } ${
                isCorrectAnswer(suggestion) ? 'text-green-600 font-medium' : 'text-gray-800'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Aide contextuelle */}
      <div className="mt-2 text-sm text-white/60">
        {showSuggestions && (
          <span>Utilisez ↑↓ pour naviguer, Entrée pour valider</span>
        )}
        {answer && isCorrectAnswer(answer) && (
          <span className="text-green-400">✓ Bonne réponse !</span>
        )}
      </div>
    </div>
  );
}
