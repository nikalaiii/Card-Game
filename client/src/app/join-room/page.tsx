'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { ApiService } from '../../services/api.service';
import { Room } from '../../types/game.types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';

export default function JoinRoomPage() {
  const router = useRouter();
  const { joinRoom, loading, error } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableRooms();
  }, []);

  const loadAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const response = await ApiService.getAllRooms();
      if (response.success && response.rooms) {
        setAvailableRooms(response.rooms);
      }
    } catch (err: any) {
      setRoomsError(err.message || 'Failed to load rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleJoinByRoomId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim() || !playerName.trim()) {
      return;
    }

    try {
      await joinRoom({
        roomId: roomId.trim(),
        playerName: playerName.trim(),
      });
      router.push(`/room/${roomId.trim()}?name=${encodeURIComponent(playerName.trim())}`);
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleJoinRoom = async (room: Room) => {
    if (!playerName.trim()) {
      return;
    }

    try {
      await joinRoom({
        roomId: room.id,
        playerName: playerName.trim(),
      });
      router.push(`/room/${room.id}?name=${encodeURIComponent(playerName.trim())}`);
    } catch (err) {
      // Error is handled by the context
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'primary';
      case 'playing':
        return 'secondary';
      case 'finished':
        return 'default';
      default:
        return 'default';
    }
  };

  const isWaitingRoom = (room: Room) => room.currentGameStatus === 'waiting';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box mb={4}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <Typography variant="h3" component="h1" gutterBottom>
            Join Room
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your name and join an available room
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Join by Room ID */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: 'fit-content' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon />
                Join by Room ID
              </Typography>
              <form onSubmit={handleJoinByRoomId}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      required
                      variant="outlined"
                      placeholder="Enter room ID..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={!roomId.trim() || !playerName.trim() || loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Joining...' : 'Join Room'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Available Rooms */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon />
                Available Rooms
              </Typography>

              {loadingRooms && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              )}

              {roomsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {roomsError}
                </Alert>
              )}

              {!loadingRooms && !roomsError && availableRooms.filter(isWaitingRoom).length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No available rooms. Create one to get started!
                  </Typography>
                </Box>
              )}

              {!loadingRooms && !roomsError && availableRooms.filter(isWaitingRoom).length > 0 && (
                <Box>
                  {availableRooms.filter(isWaitingRoom).map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Typography variant="h6" component="h2">
                                {room.name}
                              </Typography>
                              <Typography color="text.secondary">
                                Owner: {room.owner}
                              </Typography>
                            </Box>
                            <Chip
                              label={room.currentGameStatus}
                              color={getStatusColor(room.currentGameStatus) as any}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Players: {room.players?.length || 0}/{room.playerLimit}
                          </Typography>

                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => handleJoinRoom(room)}
                            disabled={!playerName.trim() || loading}
                          >
                            Join Room
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Error Display */}
        {error && (
          <Box mt={4}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </motion.div>
    </Container>
  );
}
