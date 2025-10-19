'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { ApiService } from '../services/api.service';
import { Room } from '../types/game.types';
import CasinoIcon from '@mui/icons-material/Casino';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Home() {
  const router = useRouter();
  const { isConnected, connect } = useGame();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
    loadRooms();
  }, [isConnected, connect]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getAllRooms();
      if (response.success && response.rooms) {
        setRooms(response.rooms);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/room/${roomId}`);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CasinoIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          </motion.div>
          <Typography variant="h1" component="h1" gutterBottom>
            Card Game
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Join or create a multiplayer card game room
          </Typography>
        </Box>

        {/* Connection Status */}
        <Box mb={4} textAlign="center">
          <Chip
            label={isConnected ? 'Connected to Server' : 'Connecting...'}
            color={isConnected ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={3} justifyContent="center" mb={4}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={handleCreateRoom}
              sx={{ minWidth: 200 }}
            >
              Create Room
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={handleJoinRoom}
              sx={{ minWidth: 200 }}
            >
              Join Room
            </Button>
          </motion.div>
        </Stack>

        {/* Available Rooms */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            Available Rooms
          </Typography>

          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && rooms.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No rooms available. Create one to get started!
              </Typography>
            </Box>
          )}

          {!loading && !error && rooms.length > 0 && (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
              {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                    onClick={() => handleRoomClick(room.id)}
                  >
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {room.name}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        Owner: {room.owner}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          Players: {room.players?.length || 0}/{room.playerLimit}
                        </Typography>
                        <Chip
                          label={room.currentGameStatus}
                          color={getStatusColor(room.currentGameStatus) as any}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
}