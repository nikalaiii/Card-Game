'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CharacterType, PlayerCharacter, CharacterInfo } from '../types/game.types';
import { ApiService } from '../services/api.service';

interface CharacterContextType {
  character: PlayerCharacter | null;
  setCharacter: (character: PlayerCharacter | null) => void;
  hasCharacter: boolean;
  characterTypes: CharacterInfo[];
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);

  // Character types configuration
  const characterTypes: CharacterInfo[] = [
    {
      type: 'peaks',
      name: 'Peaks King',
      description: 'Can see one random opponent\'s card',
      image: '/media/peaks_king.png',
    },
    {
      type: 'crosses',
      name: 'Crosses King',
      description: 'can attack non related card for defender one time',
      image: '/media/crosses_king.png',
    },
    {
      type: 'hearts',
      name: 'Hearts King',
      description: 'can defend with any card one time',
      image: '/media/hearts_king.png',
    }
  ];

  // Load character from sessionStorage on mount
  useEffect(() => {
    const savedCharacter = sessionStorage.getItem('playerCharacter');
    if (savedCharacter) {
      try {
        setCharacter(JSON.parse(savedCharacter));
      } catch (error) {
        console.error('Failed to parse saved character:', error);
        sessionStorage.removeItem('playerCharacter');
      }
    }
  }, []);

  // Save character to sessionStorage and database when it changes
  const handleSetCharacter = async (newCharacter: PlayerCharacter | null) => {
    setCharacter(newCharacter);
    if (newCharacter) {
      sessionStorage.setItem('playerCharacter', JSON.stringify(newCharacter));
      
      // Save to database
      try {
        await ApiService.createCharacter(newCharacter);
        console.log('Character saved to database:', newCharacter);
      } catch (error) {
        console.error('Failed to save character to database:', error);
        // Still keep it in sessionStorage as fallback
      }
    } else {
      sessionStorage.removeItem('playerCharacter');
    }
  };

  const contextValue: CharacterContextType = {
    character,
    setCharacter: handleSetCharacter,
    hasCharacter: character !== null,
    characterTypes,
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

