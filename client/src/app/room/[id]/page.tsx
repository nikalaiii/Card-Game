"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../../../contexts/GameContext";
import { useCharacter } from "../../../contexts/CharacterContext";
import { ApiService } from "../../../services/api.service";
import {
  Card as GameCard,
  PlayerInRoom,
} from "../../../types/game.types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { CardComponent } from "../../../components/CardComponent";
import { GameTable } from "../../../components/GameTable";
import Image from "next/image";

export default function GameRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const { character } = useCharacter();

  const {
    currentRoom,
    gameState,
    startGame,
    leaveRoom,
    gameAction,
    hydrateRoom,
    loading,
    error,
    connect,
  } = useGame();

  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [localCurrentPlayer, setLocalCurrentPlayer] =
    useState<(PlayerInRoom & { sessionId?: string }) | null>(null);
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const loadRoomData = async () => {
    try {
      const response = await ApiService.getRoom(roomId);
      if (response.success && response.room) {
        hydrateRoom(response.room);
      }
    } catch (err: any) {
      console.error("Failed to load room:", err.message);
    }
  };

  const room = currentRoom;
  const effectiveCurrentPlayer = localCurrentPlayer;

  useEffect(() => {
    connect();
    
    // Cleanup old global storage keys on mount
    const oldKey = 'currentPlayerName';
    if (localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey);
      console.log('Cleaned up old global storage key:', oldKey);
    }
  }, []);

  useEffect(() => {
    if (roomId && !currentRoom) {
      loadRoomData();
    }
  }, [roomId, currentRoom]);

  // Set current player when room data is loaded
  useEffect(() => {
    if (!room) return;
    
    const key = `cg:room:${room.id}:player`;
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    
    if (raw) {
      try {
        const saved = JSON.parse(raw) as { id: string; name: string };
        const foundPlayer = room.players?.find(p => p.id === saved.id || p.name === saved.name);
        
        if (foundPlayer) {
          // Create a unique player object for this session
          const uniquePlayer = {
            ...foundPlayer,
            // Add session-specific identifier to prevent cross-contamination
            sessionId: sessionId,
          };
          setLocalCurrentPlayer(uniquePlayer);
          console.log(
            "Set local current player for session:",
            uniquePlayer.name,
            "Session ID:",
            uniquePlayer.sessionId
          );
        } else {
          console.log(
            "Player not found in room:",
            saved.name,
            "Available players:",
            room.players.map((p) => p.name)
          );
        }
      } catch (error) {
        console.error("Failed to parse saved player data:", error);
      }
    } else {
      // Fallback: check URL parameters for player name (only for first-time join)
      const urlParams = new URLSearchParams(window.location.search);
      const playerName = urlParams.get("name");
      
      if (playerName) {
        const foundPlayer = room.players.find((p) => p.name === playerName);
        if (foundPlayer) {
          // Store in room-scoped storage for future use
          const payload = JSON.stringify({ id: foundPlayer.id, name: foundPlayer.name });
          sessionStorage.setItem(key, payload);
          localStorage.setItem(key, payload);
          
          // Create a unique player object for this session
          const uniquePlayer = {
            ...foundPlayer,
            sessionId: sessionId,
          };
          setLocalCurrentPlayer(uniquePlayer);
          console.log(
            "Set local current player from URL:",
            uniquePlayer.name,
            "Session ID:",
            uniquePlayer.sessionId
          );
        } else {
          console.log(
            "Player not found in room:",
            playerName,
            "Available players:",
            room.players.map((p) => p.name)
          );
        }
      } else {
        console.log("No player data found in storage or URL");
      }
    }
  }, [room, sessionId]);

  // Update local currentPlayer when gameState changes
  useEffect(() => {
    if (gameState && localCurrentPlayer && gameState.players) {
      console.log(`[FRONTEND] Game state received: ${JSON.stringify({
        activeCards: gameState.activeCards,
        currentAttacker: gameState.currentAttacker,
        currentDefender: gameState.currentDefender,
        status: gameState.status
      })}`);
      
      console.log(`[FRONTEND] Active cards details: ${JSON.stringify(
        gameState.activeCards.map((pair, index) => ({
          index,
          attackingCard: pair.attackingCard.shortName,
          defendingCard: pair.defendingCard?.shortName || null,
          isDefended: !!pair.defendingCard
        }))
      )}`);
      
      const updatedPlayer = gameState.players.find(
        (p: any) => p.id === localCurrentPlayer.id
      );
      if (updatedPlayer) {
        // Only update if there are actual changes to prevent infinite loops
        const hasChanges = 
          JSON.stringify(updatedPlayer.cards) !== JSON.stringify(localCurrentPlayer.cards) ||
          updatedPlayer.status !== localCurrentPlayer.status;
        
        if (hasChanges) {
          setLocalCurrentPlayer((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              cards: updatedPlayer.cards,
              status: updatedPlayer.status,
            };
          });
          console.log(
            "Updated local current player with new game state:",
            updatedPlayer.name
          );
        }
      }
    }
  }, [gameState]); // Removed localCurrentPlayer from dependencies

  const handleStartGame = () => {
    if (effectiveCurrentPlayer && effectiveCurrentPlayer.role === "owner") {
      startGame();
    }
  };

  const handleLeaveRoom = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeave = () => {
    leaveRoom();
    router.push("/");
  };

  const handleCardClick = (card: GameCard) => {
    if (!effectiveCurrentPlayer || !gameState) {
      console.log("HANDLE CLICK CARD SITUATION 1");
      return;
    };

    // Check if it's the player's turn
    const isPlayerTurn =
      gameState.currentAttacker === effectiveCurrentPlayer.id ||
      gameState.currentDefender === effectiveCurrentPlayer.id;

    if (!isPlayerTurn) {
      // Check if player can throw cards (same rank as attacking cards)
      console.log("HANDLE CLICK CARD SITUATION 2");
      const canThrow = gameState.activeCards.some(
        (pair) => pair.attackingCard.rank === card.rank
      );

      if (canThrow) {
        gameAction({
          type: "throw_cards",
          card,
        });
      }
      return;
    }

    if (selectedCard) {
      console.log("HANDLE CLICK CARD SITUATION 3");
      // Second card selected - this should not happen for defense anymore
      // Defense should only be done through onDefendAgainst callback
      setSelectedCard(null);
    } else {
      console.log("HANDLE CLICK CARD SITUATION 4");
      // First card selected
      if (gameState.currentAttacker === effectiveCurrentPlayer.id) {
        console.log("HANDLE CLICK CARD SITUATION A");
        gameAction({
          type: "attack",
          card,
        });
      } else if (gameState.currentDefender === effectiveCurrentPlayer.id) {
        console.log("HANDLE CLICK CARD SITUATION B");
        setSelectedCard(card);
      }
    }
  };

  const handlePass = () => {
    if (
      effectiveCurrentPlayer &&
      gameState?.currentAttacker === effectiveCurrentPlayer.id
    ) {
      gameAction({
        type: "pass",
      });
    }
  };

  const handleTakeCards = () => {
    if (
      effectiveCurrentPlayer &&
      gameState?.currentDefender === effectiveCurrentPlayer.id
    ) {
      gameAction({
        type: "take_cards",
      });
    }
  };

  const handleDefendAgainst = (
    attackingCard: GameCard,
    defendingCard: GameCard
  ) => {
    if (
      effectiveCurrentPlayer &&
      gameState?.currentDefender === effectiveCurrentPlayer.id
    ) {
      console.log('[DEFEND] sending', {
        attack: attackingCard.shortName,
        defend: defendingCard.shortName,
      });
      
      const actionPayload = {
        type: "defend" as const,
        card: attackingCard, // IMPORTANT: first the ATTACKING card from the table
        defendingCard: defendingCard, // Then the card with the hands
      };
      
      console.log('[DEFEND] Full action payload:', JSON.stringify(actionPayload, null, 2));
      
      gameAction(actionPayload);
      setSelectedCard(null);
    }
  };

  const handleUseAbility = (abilityType: 'peaks_vision' | 'crosses_throw' | 'hearts_defend') => {
    if (!effectiveCurrentPlayer || !gameState) return;

    console.log(`[USE-ABILITY] Using ${abilityType} ability`);
    
    if (abilityType === 'peaks_vision') {
      // Peaks vision doesn't need a card selection
      const actionPayload = {
        type: "use_ability" as const,
        abilityType: abilityType,
      };
      gameAction(actionPayload);
    } else if (abilityType === 'crosses_throw') {
      // For crosses throw, we need to show card selection
      if (!selectedCard) {
        alert('Please select a card to throw with your ability');
        return;
      }
      const actionPayload = {
        type: "use_ability" as const,
        abilityType: abilityType,
        card: selectedCard,
      };
      gameAction(actionPayload);
      setSelectedCard(null);
    } else if (abilityType === 'hearts_defend') {
      // For hearts defend, we need to show card selection
      if (!selectedCard) {
        alert('Please select a card to defend with your ability');
        return;
      }
      // Find the attacking card to defend against
      const attackingCard = gameState.activeCards.find(pair => !pair.defendingCard)?.attackingCard;
      if (!attackingCard) {
        alert('No attacking card to defend against');
        return;
      }
      const actionPayload = {
        type: "use_ability" as const,
        abilityType: abilityType,
        card: attackingCard,
        defendingCard: selectedCard,
      };
      gameAction(actionPayload);
      setSelectedCard(null);
    }
  };

  const getPlayerStatus = (player: any) => {
    if (!gameState) return player.status || "waiting";
    if (gameState.currentAttacker === player.id) return "attacker";
    if (gameState.currentDefender === player.id) return "defender";
    return player.status || "waiting";
  };

  const getPlayerStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'attacker':
        return 'secondary';
      case 'defender':
        return 'warning';
      case 'waiting':
        return 'default';
      default:
        return 'default';
    }
  };

  const isPlayerTurn = (playerId: string) => {
    if (!gameState) return false;
    return (
      gameState.currentAttacker === playerId ||
      gameState.currentDefender === playerId
    );
  };

  if (loading && !room) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Room not found. Please check the room ID and try again.
        </Alert>
      </Container>
    );
  }

  // Layout helpers for seating around edges
  const arrangedPlayers = room.players || [];
  const getSeatPosition = (index: number, total: number) => {
    if (total === 2) return index === 0 ? 'bottom' : 'top';
    const positions = ['bottom', 'right', 'top', 'left', 'top-right'];
    return positions[index % positions.length];
  };

  const borderForRole = (playerId: string) => {
    if (!gameState) return undefined;
    if (gameState.currentAttacker === playerId) return '3px solid #e53935';
    if (gameState.currentDefender === playerId) return '3px solid #43a047';
    return undefined;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box mb={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
            <Button
              startIcon={<ExitToAppIcon />}
              onClick={handleLeaveRoom}
              color="error"
              variant="outlined"
            >
              Leave Room
            </Button>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" component="h1" gutterBottom>
              {room.name}
            </Typography>
            {/* Kinmate info top-left equivalent (placed near header) */}
            {character && (
              <Box display="flex" alignItems="center" gap={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 2, py: 1 }}>
                <Typography variant="h6">{character.avatar}</Typography>
                <Box>
                  <Typography variant="body1" fontWeight={600}>{character.username}</Typography>
                  <Typography variant="body2" color="text.secondary">{character.characterType}</Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <Chip
              label={room.currentGameStatus}
              color={
                room.currentGameStatus === "waiting" ? "primary" : "secondary"
              }
            />
            <Typography variant="body1" color="text.secondary">
              Players: {room.players?.length || 0}/{room.playerLimit}
            </Typography>
            {gameState?.trumpSuit && (
              <Chip
                label={`Trump: ${gameState.trumpSuit}`}
                color="warning"
                variant="outlined"
              />
            )}
          </Box>

          {/* Room ID Display */}
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Room ID: <strong>{room.id}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Game Status */}
        {gameState && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Game Status
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Typography variant="body2" color="text.secondary">
                Current Attacker: {gameState.players.find((p) => p.id === gameState.currentAttacker)?.name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Defender: {gameState.players.find((p) => p.id === gameState.currentDefender)?.name || 'Unknown'}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Main game area with left sidebar */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Left sidebar for game actions */}
          <Box sx={{ width: 300, flexShrink: 0 }}>
            {/* Game Actions */}
            {room.currentGameStatus === "waiting" &&
              effectiveCurrentPlayer?.role === "owner" && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Game Controls
                  </Typography>
                  {(() => {
                    // Check for players that are either 'active' or 'waiting' (connected players)
                    const connectedPlayers = room.players?.filter(p => 
                      (p.status as string) === 'active' || (p.status as string) === 'waiting'
                    ).length || 0;
                    const totalPlayers = room.players?.length || 0;
                    const canStart = connectedPlayers === totalPlayers && totalPlayers >= 2;
                    
                    return (
                      <>
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          startIcon={<PlayArrowIcon />}
                          onClick={handleStartGame}
                          disabled={loading || !canStart}
                          sx={{ mb: 2 }}
                        >
                          Start Game
                        </Button>
                        {!canStart && (
                          <Typography variant="body2" color="text.secondary">
                            {connectedPlayers < totalPlayers 
                              ? `Waiting for ${totalPlayers - connectedPlayers} player(s) to connect...`
                              : 'Need at least 2 players to start'
                            }
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                </Paper>
              )}

            {/* Game Action Buttons */}
            {gameState && (gameState.status === 'playing' || gameState.status === 'waiting') && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Your Actions
                </Typography>
                {(() => {
                  console.log('Game Action Debug:', {
                    gameState: gameState.status,
                    currentAttacker: gameState.currentAttacker,
                    currentDefender: gameState.currentDefender,
                    currentPlayerId: effectiveCurrentPlayer?.id,
                    isAttacker: gameState.currentAttacker === effectiveCurrentPlayer?.id,
                    isDefender: gameState.currentDefender === effectiveCurrentPlayer?.id
                  });
                  return null;
                })()}
                <Box display="flex" flexDirection="column" gap={2}>
                  {gameState.currentAttacker === effectiveCurrentPlayer?.id && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handlePass}
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      Pass
                    </Button>
                  )}
                  {gameState.currentDefender === effectiveCurrentPlayer?.id && (
                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      onClick={handleTakeCards}
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      Take Cards
                    </Button>
                  )}
                  {gameState.currentAttacker !== effectiveCurrentPlayer?.id && 
                   gameState.currentDefender !== effectiveCurrentPlayer?.id && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Wait for your turn
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}

            {/* Character Abilities */}
            {gameState && gameState.status === 'playing' && effectiveCurrentPlayer && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Character Abilities
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {effectiveCurrentPlayer.characterType === 'peaks' && !effectiveCurrentPlayer.abilityUsed && (
                    <Button
                      variant="outlined"
                      color="info"
                      size="large"
                      onClick={() => handleUseAbility('peaks_vision')}
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      Peaks Vision (See opponent cards)
                    </Button>
                  )}
                  {effectiveCurrentPlayer.characterType === 'crosses' && 
                   !effectiveCurrentPlayer.abilityUsed && 
                   gameState.currentAttacker === effectiveCurrentPlayer.id && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      onClick={() => handleUseAbility('crosses_throw')}
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      Crosses Throw (Select card first)
                    </Button>
                  )}
                  {effectiveCurrentPlayer.characterType === 'hearts' && 
                   !effectiveCurrentPlayer.abilityUsed && 
                   gameState.currentDefender === effectiveCurrentPlayer.id && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={() => handleUseAbility('hearts_defend')}
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      Hearts Defend (Select card first)
                    </Button>
                  )}
                  {effectiveCurrentPlayer.abilityUsed && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Ability used this round
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}
          </Box>

          {/* Main game area */}
          <Box sx={{ flex: 1, position: 'relative', height: 520 }}>
            {/* Center green table */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: 260,
                background: '#2e7d32',
                borderRadius: 6,
                border: '4px solid #000',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              {gameState && (
                <GameTable
                  gameState={gameState}
                  currentPlayer={effectiveCurrentPlayer}
                  onCardClick={handleCardClick}
                  onPass={handlePass}
                  onTakeCards={handleTakeCards}
                  selectedCard={selectedCard}
                  onDefendAgainst={handleDefendAgainst}
                />
              )}
            </Box>

          {arrangedPlayers.map((player, index) => {
            const seat = getSeatPosition(index, arrangedPlayers.length);
            const baseStyle: any = { position: 'absolute', display: 'flex', alignItems: 'center', gap: 1 };
            if (seat === 'top') Object.assign(baseStyle, { top: 0, left: '50%', transform: 'translateX(-50%)' });
            if (seat === 'bottom') Object.assign(baseStyle, { bottom: 0, left: '50%', transform: 'translateX(-50%)' });
            if (seat === 'left') Object.assign(baseStyle, { left: 0, top: '50%', transform: 'translateY(-50%)' });
            if (seat === 'right') Object.assign(baseStyle, { right: 0, top: '50%', transform: 'translateY(-50%)' });
            if (seat === 'top-right') Object.assign(baseStyle, { top: 0, right: 0, transform: 'translateY(0)' });

            const seatCardBg = player.id === effectiveCurrentPlayer?.id ? 'action.hover' : 'background.paper';
            return (
              <Box key={player.id} sx={baseStyle}>
                {/* Visible cards for Peaks King */}
                {player.visibleCards && player.visibleCards.length > 0 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: seat === 'top' ? -60 : seat === 'bottom' ? -60 : seat === 'left' ? -30 : -30,
                    left: seat === 'left' ? -80 : seat === 'right' ? -80 : '50%',
                    transform: seat === 'left' || seat === 'right' ? 'translateY(-50%)' : 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                    zIndex: 10
                  }}>
                    {player.visibleCards.map((card: any, cardIndex: number) => (
                      <Card key={cardIndex} sx={{ 
                        width: 40, 
                        height: 56, 
                        border: '2px solid #ff6b6b',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 'bold',
                        bgcolor: '#fff',
                        boxShadow: 2
                      }}>
                        {card.shortName}
                      </Card>
                    ))}
                  </Box>
                )}
                
                <Card sx={{ minWidth: 220, border: borderForRole(player.id), borderRadius: 3, bgcolor: seatCardBg }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        backgroundColor: '#fff',
                        overflow: 'hidden',
                      }}>
                        {(() => {
                          console.log(`Player ${player.name} avatar:`, player.avatar);
                          if (player.avatar && player.avatar.startsWith('/')) {
                            return <Image src={player.avatar} alt={player.name} width={48} height={48} />;
                          } else {
                            return player.avatar || '👤';
                          }
                        })()}
                      </Box>
                      <Box sx={{ minWidth: 120 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={600}>{player.name}</Typography>
                          {player.id === effectiveCurrentPlayer?.id && (
                            <Chip label="You" size="small" />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {player.characterType || '—'} • {player.role}
                        </Typography>
                        <Box mt={0.5}>
                          <Chip size="small" label={getPlayerStatus(player)} color={getPlayerStatusColor(getPlayerStatus(player)) as any} />
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
          </Box>
        </Box>


        {/* Deck Information */}
        {gameState && (
          <Box mt={1} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Cards remaining in deck: {gameState.deck.length}
            </Typography>
          </Box>
        )}

        {/* Player's Cards */}
        {effectiveCurrentPlayer && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Cards ({effectiveCurrentPlayer.cards?.length || 0})
            </Typography>
            {effectiveCurrentPlayer.cards &&
            effectiveCurrentPlayer.cards.length > 0 ? (
              <Box display="flex" gap={1} flexWrap="wrap">
                {effectiveCurrentPlayer.cards.map((card, index) => (
                  <motion.div
                    key={`${card.shortName}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CardComponent
                      card={card}
                      onClick={() => handleCardClick(card)}
                      selected={selectedCard?.shortName === card.shortName}
                      clickable={true}
                    />
                  </motion.div>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">
                No cards yet.{" "}
                {gameState?.status === "playing"
                  ? "Cards should appear when the game starts."
                  : "Cards will be dealt when the game starts."}
              </Typography>
            )}
          </Paper>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <Paper sx={{ p: 2, mt: 2, backgroundColor: "#f5f5f5" }}>
            <Typography variant="h6" gutterBottom>
              Debug Info
            </Typography>
            <Typography variant="body2">
              <strong>Local Current Player:</strong>{" "}
              {JSON.stringify(effectiveCurrentPlayer, null, 2)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Session ID:</strong>{" "}
              {effectiveCurrentPlayer?.sessionId || "Not set"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Browser Session ID:</strong> {sessionId}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Game State:</strong> {JSON.stringify(gameState, null, 2)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Room Players Count:</strong> {room?.players?.length || 0}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Game Status:</strong> {gameState?.status || 'No game state'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Current Attacker:</strong> {gameState?.currentAttacker || 'None'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Current Defender:</strong> {gameState?.currentDefender || 'None'}
            </Typography>
          </Paper>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        )}

        {/* Leave Room Dialog */}
        <Dialog
          open={showLeaveDialog}
          onClose={() => setShowLeaveDialog(false)}
        >
          <DialogTitle>Leave Room</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave this room? You won't be able to
              rejoin the current game.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLeaveDialog(false)}>Cancel</Button>
            <Button onClick={confirmLeave} color="error">
              Leave Room
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
}
