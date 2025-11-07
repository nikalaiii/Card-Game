'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useCharacter } from '../../contexts/CharacterContext';
import { CharacterType, PlayerCharacter } from '../../types/game.types';
import { Kalnia_Glaze } from 'next/font/google';
import Image from 'next/image';

const kalnia = Kalnia_Glaze({ weight: ['400','700'], subsets: ['latin'], display: 'swap' });

// Default MUI avatars for the carousel '👤', '🎭', '🎪'
const avatars = [
  {
    default: "👤",
    path: "/media/avatarN.png"
  },
  {
    default: "🎭",
    path: "/media/avatarV.png"
  },
  {
    default: "🎪",
    path: "/media/avatarA.png"
  },
];

export default function CreateCharacter() {
  const router = useRouter();
  const { characterTypes, setCharacter } = useCharacter();
  
  const [username, setUsername] = useState('');
  const [selectedCharacterType, setSelectedCharacterType] = useState<CharacterType | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(avatars[0].path);
  const [hoveredCharacterType, setHoveredCharacterType] = useState<CharacterType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCharacterTypeChange = (characterType: CharacterType) => {
    setSelectedCharacterType(characterType);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!selectedCharacterType) {
      setError('Please select a character type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create character object
      const newCharacter: PlayerCharacter = {
        username: username.trim(),
        characterType: selectedCharacterType,
        avatar: selectedAvatar,
      };

      // Save character (this will save to both localStorage and database)
      await setCharacter(newCharacter);
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const getCharacterInfo = () => {
    const type = hoveredCharacterType || selectedCharacterType;
    return characterTypes.find(ct => ct.type === type);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Side - Form (50% viewport width) */}
      <Box
        sx={{
          width: '50vw',
          height: '100vh',
          overflowY: 'auto',
          padding: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <Box textAlign="center" mb={6}>
            <Typography style={{ fontFamily: kalnia.style.fontFamily }} variant="h1" component="h1" gutterBottom>
              Create Your Character
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Choose your character type and avatar to start playing
            </Typography>
          </Box>

          <Paper elevation={3} sx={{ p: 4 }}>
            {/* Horizontal layout: Username | Character Type | Avatar */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                mb: 3,
              }}
            >
              <Box sx={{ flex: '1 1 300px', minWidth: 220 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="outlined"
                  placeholder="Enter your username"
                />
              </Box>

              <Box sx={{ flex: '1 1 320px', minWidth: 240 }}>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Character Type
                  </FormLabel>
                  <FormGroup>
                    {characterTypes.map((charType) => (
                      <FormControlLabel
                        key={charType.type}
                        control={
                          <Checkbox
                            checked={selectedCharacterType === charType.type}
                            onChange={() => handleCharacterTypeChange(charType.type)}
                          
                          />
                        }
                        label={charType.name}
                        onMouseEnter={() => setHoveredCharacterType(charType.type)}
                        onMouseLeave={() => setHoveredCharacterType(null)}
                        sx={{
                          py: 0.5,
                          px: 1,
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Box>

              <Box>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Avatar
                  </FormLabel>
                  <Grid container spacing={1}>
                    {avatars.map((avatar, index) => (
                      <Grid item key={index}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            cursor: 'pointer',
                            border: selectedAvatar === avatar.path ? 3 : 1,
                            borderColor: selectedAvatar === avatar.path ? 'primary.main' : 'divider',
                            '&:hover': { transform: 'scale(1.1)', transition: 'transform 0.2s' },
                          }}
                          onClick={() => setSelectedAvatar(avatar.path)}
                        >
                          <Image src={avatar.path} alt={avatar.default} width={48} height={48} />
                        </Avatar>
                      </Grid>
                    ))}
                  </Grid>
                </FormControl>
              </Box>
            </Box>

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading || !username.trim() || !selectedCharacterType}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Character'
              )}
            </Button>
          </Paper>
        </motion.div>
      </Box>

      {/* Right Side - Character Preview (50% viewport width) */}
      <Box
        sx={{
          width: '50vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {selectedCharacterType ? (
            <Box textAlign="center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/*
                  Use characterTypes data (preferred: add image property to each type)
                  or a local mapping to pick the right image for the selected type.
                */}
                {(() => {
                  const info = getCharacterInfo();
                  const imageSrc =
                    info?.image ?? `/media/${info?.type ?? 'peaks_king'}.png`;
                  return (
                    <Image
                      src={imageSrc}
                      alt={String(selectedCharacterType)}
                      width={400}
                      height={600}
                      style={{
                        objectFit: 'contain',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                  );
                })()}
              </motion.div>
              
              <Typography
                variant="h3"
                sx={{
                  color: '#FFD700',
                  fontWeight: 'bold',
                  mt: 3,
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {characterTypes.find(ct => ct.type === selectedCharacterType)?.name}
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  mt: 2,
                  maxWidth: '400px',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                }}
              >
                {characterTypes.find(ct => ct.type === selectedCharacterType)?.description}
              </Typography>

              {username && (
                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '15px',
                    border: '2px solid #FFD700',
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                    Character Preview
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', mt: 1 }}>
                    Username: {username}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    Avatar: {selectedAvatar}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box textAlign="center">
              <Typography
                variant="h2"
                sx={{
                  color: '#FFD700',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                Select Character
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  mt: 3,
                  opacity: 0.8,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                }}
              >
                Choose a character type to see the preview
              </Typography>
            </Box>
          )}
        </motion.div>
      </Box>
    </Box>
  );
}
