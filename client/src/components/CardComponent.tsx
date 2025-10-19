'use client';

import { Card as MuiCard, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { Card as GameCard } from '../types/game.types';

interface CardComponentProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  clickable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function CardComponent({ 
  card, 
  onClick, 
  selected = false, 
  clickable = false,
  size = 'medium'
}: CardComponentProps) {
  const getCardColor = (suit: string) => {
    switch (suit) {
      case 'H': // Hearts
      case 'D': // Diamonds
        return '#d32f2f';
      case 'S': // Spades
      case 'C': // Clubs
        return '#212121';
      default:
        return '#212121';
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'H': return '♥';
      case 'D': return '♦';
      case 'S': return '♠';
      case 'C': return '♣';
      default: return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 60,
          height: 84,
          fontSize: 12,
        };
      case 'large':
        return {
          width: 120,
          height: 168,
          fontSize: 24,
        };
      default: // medium
        return {
          width: 80,
          height: 112,
          fontSize: 16,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <motion.div
      whileHover={clickable ? { y: -5, scale: 1.05 } : {}}
      whileTap={clickable ? { scale: 0.95 } : {}}
      animate={selected ? { y: -10 } : { y: 0 }}
    >
      <MuiCard
        sx={{
          width: sizeStyles.width,
          height: sizeStyles.height,
          cursor: clickable ? 'pointer' : 'default',
          border: selected ? '3px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          boxShadow: selected ? 4 : 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': clickable ? {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Top left corner */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: sizeStyles.fontSize * 0.8,
                fontWeight: 'bold',
                color: getCardColor(card.suit),
                lineHeight: 1,
              }}
            >
              {card.rank === 'T' ? '10' : card.rank}
            </Typography>
            <Typography
              sx={{
                fontSize: sizeStyles.fontSize * 0.8,
                color: getCardColor(card.suit),
                lineHeight: 1,
              }}
            >
              {getSuitSymbol(card.suit)}
            </Typography>
          </Box>

          {/* Center symbol */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: sizeStyles.fontSize * 1.5,
                color: getCardColor(card.suit),
                lineHeight: 1,
              }}
            >
              {getSuitSymbol(card.suit)}
            </Typography>
          </Box>

          {/* Bottom right corner (rotated) */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              transform: 'rotate(180deg)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: sizeStyles.fontSize * 0.8,
                fontWeight: 'bold',
                color: getCardColor(card.suit),
                lineHeight: 1,
              }}
            >
              {card.rank === 'T' ? '10' : card.rank}
            </Typography>
            <Typography
              sx={{
                fontSize: sizeStyles.fontSize * 0.8,
                color: getCardColor(card.suit),
                lineHeight: 1,
              }}
            >
              {getSuitSymbol(card.suit)}
            </Typography>
          </Box>
        </CardContent>
      </MuiCard>
    </motion.div>
  );
}
