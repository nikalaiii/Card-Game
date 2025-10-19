'use client';

import { useState } from 'react';
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
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import { CreateRoomRequest } from '../../types/game.types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CreateRoomPage() {
  const router = useRouter();
  const { createRoom, loading, error } = useGame();
  const [formData, setFormData] = useState({
    name: '',
    playerLimit: 4,
    owner: '',
    playerNames: [] as string[],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addPlayerName = () => {
    if (formData.playerNames.length < formData.playerLimit - 1) {
      setFormData(prev => ({
        ...prev,
        playerNames: [...prev.playerNames, ''],
      }));
    }
  };

  const removePlayerName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      playerNames: prev.playerNames.filter((_, i) => i !== index),
    }));
  };

  const updatePlayerName = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      playerNames: prev.playerNames.map((name, i) => i === index ? value : name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      return;
    }

    // Filter out empty player names
    const validPlayerNames = [formData.owner, ...formData.playerNames].filter(name => name.trim());
    
    if (validPlayerNames.length < 2) {
      return;
    }

    const createRoomRequest: CreateRoomRequest = {
      name: formData.name,
      playerLimit: formData.playerLimit,
      playerNames: validPlayerNames,
      owner: formData.owner,
    };

    try {
      const room = await createRoom(createRoomRequest);
      // Redirect to the created room page
      router.push(`/room/${room.id}`);
    } catch (err) {
      // Error is handled by the context
    }
  };

  const isFormValid = formData.name.trim() && 
                     formData.owner.trim() && 
                     formData.playerNames.filter(name => name.trim()).length >= 1;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
            Create Room
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up a new game room and invite players
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Room Name */}
              <TextField
                fullWidth
                label="Room Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                variant="outlined"
              />

              {/* Owner Name and Player Limit */}
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  label="Your Name (Owner)"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  required
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Player Limit"
                  type="number"
                  value={formData.playerLimit}
                  onChange={(e) => handleInputChange('playerLimit', parseInt(e.target.value) || 4)}
                  inputProps={{ min: 2, max: 6 }}
                  variant="outlined"
                />
              </Box>

              {/* Player Names */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Typography variant="h6">Additional Players</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addPlayerName}
                    disabled={formData.playerNames.length >= formData.playerLimit - 1}
                  >
                    Add Player
                  </Button>
                </Box>

                {formData.playerNames.map((name, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        fullWidth
                        label={`Player ${index + 2} Name`}
                        value={name}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        variant="outlined"
                      />
                      <IconButton
                        onClick={() => removePlayerName(index)}
                        color="error"
                        sx={{ alignSelf: 'flex-end' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </motion.div>
                ))}

                <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                  <Chip label={`Owner: ${formData.owner || 'Not set'}`} color="primary" />
                  {formData.playerNames.filter(name => name.trim()).map((name, index) => (
                    <Chip key={index} label={name} variant="outlined" />
                  ))}
                </Box>
              </Box>

              {/* Error Display */}
              {error && (
                <Alert severity="error">{error}</Alert>
              )}

              {/* Submit Button */}
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isFormValid || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </motion.div>
    </Container>
  );
}
