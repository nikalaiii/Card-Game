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
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Game Table
      </Typography>

      {/* Active Cards */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Active Cards
        </Typography>
        
        {gameState.activeCards.length === 0 ? (
          <Box
            sx={{
              height: 150,
              border: '2px dashed #ccc',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
            }}
          >
            <Typography color="text.secondary">
              No cards on table
            </Typography>
          </Box>
        ) : (
          <Box display="flex" gap={2} flexWrap="wrap">
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
                        ? '3px solid #ff9800'
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
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Defend
                      </Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>
            ))}
          </Box>
        )}
      </Box>

      {/* Game Actions */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        
        <Grid container spacing={2}>
          {canPlayerPass() && (
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={onPass}
              >
                Pass
              </Button>
            </Grid>
          )}
          
          {canPlayerTakeCards() && (
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                onClick={onTakeCards}
              >
                Take Cards
              </Button>
            </Grid>
          )}
        </Grid>

        {selectedCard && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Selected card: {selectedCard.shortName}. Click on an attacking card on the table to defend against it, or click the same card to cancel.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Players Status */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Players Status
        </Typography>
        
        <Grid container spacing={2}>
          {gameState.players.map((player) => (
            <Grid item xs={12} sm={6} md={4} key={player.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  sx={{
                    border: isPlayerTurn(player.id) ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    bgcolor: isPlayerTurn(player.id) ? 'action.hover' : 'background.paper',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {player.name}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cards: {player.cardsCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {player.status}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
}
