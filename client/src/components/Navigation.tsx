'use client';

import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useGame } from '../contexts/GameContext';
import CasinoIcon from '@mui/icons-material/Casino';
import HomeIcon from '@mui/icons-material/Home';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, currentRoom } = useGame();

  const isActive = (path: string) => pathname === path;

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <CasinoIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Card Game
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white' }}
          />
          
          {currentRoom && (
            <Chip
              label={`Room: ${currentRoom.name}`}
              color="secondary"
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
          )}
          
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
            sx={{
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            Home
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

