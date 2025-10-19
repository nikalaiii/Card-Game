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
  Grid,
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
import { ApiService } from "../../../services/api.service";
import {
  Room,
  Card as GameCard,
  CardOnTable,
  PlayerInRoom,
} from "../../../types/game.types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { CardComponent } from "../../../components/CardComponent";
import { GameTable } from "../../../components/GameTable";

export default function GameRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

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
        type: "defend",
        card: attackingCard, // IMPORTANT: first the ATTACKING card from the table
        defendingCard: defendingCard, // Then the card with the hands
      };
      
      console.log('[DEFEND] Full action payload:', JSON.stringify(actionPayload, null, 2));
      
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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

          <Typography variant="h3" component="h1" gutterBottom>
            {room.name}
          </Typography>

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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Attacker:{" "}
                  {gameState.players.find(
                    (p) => p.id === gameState.currentAttacker
                  )?.name || "Unknown"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Defender:{" "}
                  {gameState.players.find(
                    (p) => p.id === gameState.currentDefender
                  )?.name || "Unknown"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Players List */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Players
          </Typography>
          <Grid container spacing={2}>
            {room.players?.map((player, index) => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      border:
                        player.id === effectiveCurrentPlayer?.id
                          ? "2px solid"
                          : "none",
                      borderColor: "primary.main",
                      bgcolor: isPlayerTurn(player.id)
                        ? "action.hover"
                        : "background.paper",
                    }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="h6">
                          {player.name}
                          {player.id === effectiveCurrentPlayer?.id && " (You)"}
                        </Typography>
                        <Chip
                          label={getPlayerStatus(player)}
                          color={getPlayerStatusColor(getPlayerStatus(player)) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Cards: {player.cards?.length || 0}
                        {player.role === "owner" && " • Owner"}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Game Actions */}
        {room.currentGameStatus === "waiting" &&
          effectiveCurrentPlayer?.role === "owner" && (
            <Box mb={4} textAlign="center">
              {(() => {
                const activePlayers = room.players?.filter(p => (p.status as string) === 'active').length || 0;
                const totalPlayers = room.players?.length || 0;
                const canStart = activePlayers === totalPlayers && totalPlayers >= 2;
                
                return (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleStartGame}
                      disabled={loading || !canStart}
                    >
                      Start Game
                    </Button>
                    {!canStart && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {activePlayers < totalPlayers 
                          ? `Waiting for ${totalPlayers - activePlayers} player(s) to connect...`
                          : 'Need at least 2 players to start'
                        }
                      </Typography>
                    )}
                  </>
                );
              })()}
            </Box>
          )}

        {/* Game Table */}
        {gameState && gameState.status === "playing" && (
          <>
            <GameTable
              gameState={gameState}
              currentPlayer={effectiveCurrentPlayer}
              onCardClick={handleCardClick}
              onPass={handlePass}
              onTakeCards={handleTakeCards}
              selectedCard={selectedCard}
              onDefendAgainst={handleDefendAgainst}
            />

            {/* Deck Information */}
            <Box mt={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Cards remaining in deck: {gameState.deck.length}
              </Typography>
            </Box>
          </>
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
