'use client';

import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import { GameState, Card as GameCard, CardOnTable, PlayerInRoom } from '../types/game.types';
import { CardComponent } from './CardComponent';

interface GameTableProps {
  gameState: GameState;
  currentPlayer: PlayerInRoom | null;
  onCardClick: (card: GameCard) => void;
  onPass: () => void;
  onTakeCards: () => void;
  selectedCard: GameCard | null;
  onDefendAgainst?: (attackingCard: GameCard, defendingCard: GameCard) => void;
}

export function GameTable({
  gameState,
  currentPlayer,
  onCardClick,
  onPass,
  onTakeCards,
  selectedCard,
  onDefendAgainst,
}: GameTableProps) {
  const isPlayerTurn = (playerId: string) => {
    return gameState.currentAttacker === playerId || gameState.currentDefender === playerId;
  };

  const canPlayerPass = () => {
    if (!currentPlayer || !isPlayerTurn(currentPlayer.id)) return false;
    if (gameState.currentAttacker !== currentPlayer.id) return false;
    
    // Check if all cards are defended
    return gameState.activeCards.every(pair => pair.defendingCard);
  };

  const canPlayerTakeCards = () => {
    if (!currentPlayer || !isPlayerTurn(currentPlayer.id)) return false;
    return gameState.currentDefender === currentPlayer.id;
  };

  const canPlayerThrowCards = () => {
    if (!currentPlayer || isPlayerTurn(currentPlayer.id)) return false;
    
    // Check if player has cards with same rank as attacking cards
    if (!currentPlayer.cards || currentPlayer.cards.length === 0) return false;
    
    return gameState.activeCards.some(pair => 
      currentPlayer.cards!.some(card => card.rank === pair.attackingCard.rank)
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Active Cards on green table center */}
      {gameState.activeCards.length === 0 ? (
        <Box
          sx={{
            height: 140,
            border: '2px dashed rgba(255,255,255,0.6)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'white',
            px: 2,
          }}
        >
          <Typography color="inherit">No cards on table</Typography>
        </Box>
      ) : (
        <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
          {gameState.activeCards.map((pair, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Box display="flex" flexDirection="column" gap={1}>
                {/* Attacking Card */}
                <Box
                  sx={{
                    border: selectedCard && 
                      !pair.defendingCard && 
                      gameState.currentDefender === currentPlayer?.id
                      ? '3px solid #ffeb3b'
                      : 'none',
                    borderRadius: 2,
                    padding: '2px',
                  }}
                >
                  <CardComponent
                    card={pair.attackingCard}
                    size="medium"
                    onClick={
                      selectedCard && 
                      !pair.defendingCard && 
                      gameState.currentDefender === currentPlayer?.id
                        ? () => onDefendAgainst?.(pair.attackingCard, selectedCard)
                        : undefined
                    }
                    clickable={
                      selectedCard && 
                      !pair.defendingCard && 
                      gameState.currentDefender === currentPlayer?.id
                    }
                  />
                </Box>
                
                {/* Defending Card */}
                {pair.defendingCard ? (
                  <CardComponent
                    card={pair.defendingCard}
                    size="medium"
                  />
                ) : (
                  <Box
                    sx={{
                      width: 80,
                      height: 112,
                      border: '2px dashed rgba(255,255,255,0.6)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'white',
                    }}
                  >
                    <Typography variant="caption" color="inherit">
                      Defend
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Game Status Info */}
      {selectedCard && (
        <Box mt={2}>
          <Typography variant="body2" color="white" textAlign="center">
            Selected: {selectedCard.shortName}. Click an attacking card to defend.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
