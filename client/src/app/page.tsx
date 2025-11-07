"use client";

import { Kalnia_Glaze } from "next/font/google";
const kalnia = Kalnia_Glaze({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import { useGame } from "../contexts/GameContext";
import { useCharacter } from "../contexts/CharacterContext";
import { ApiService } from "../services/api.service";
import { Room } from "../types/game.types";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LockIcon from "@mui/icons-material/Lock";
import HelpIcon from "@mui/icons-material/Help";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isConnected, connect } = useGame();
  const { hasCharacter } = useCharacter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

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
      setError(err.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!hasCharacter) {
      setError("Please create a character first before creating a room");
      return;
    }
    router.push("/create-room");
  };

  const handleJoinRoom = () => {
    if (!hasCharacter) {
      setError("Please create a character first before joining a room");
      return;
    }
    router.push("/join-room");
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "primary";
      case "playing":
        return "secondary";
      case "finished":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              position: 'relative',
              maxWidth: '700px',
              margin: '0 auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                right: '-4px',
                bottom: '-4px',
                background: 'linear-gradient(45deg, #FFD700, #FFA500, #B8860B, #FFD700, #FF8C00, #FFD700)',
                borderRadius: '30px',
                zIndex: -1,
                animation: 'goldenBorder 3s linear infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 50%, rgba(139, 0, 0, 0.9) 100%)',
                borderRadius: '28px',
                zIndex: -1,
              }
            }}
          >
            <motion.div
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(139, 0, 0, 0.85) 0%, 
                    rgba(0, 0, 0, 0.9) 30%,
                    rgba(139, 0, 0, 0.85) 70%,
                    rgba(0, 0, 0, 0.9) 100%
                  ),
                  radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 60%),
                  radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.15) 0%, transparent 60%),
                  radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 70%)
                `,
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                padding: '40px',
                borderRadius: '25px',
                position: 'relative',
                boxShadow: `
                  0 25px 50px rgba(0, 0, 0, 0.7),
                  0 0 0 1px rgba(255, 215, 0, 0.4),
                  inset 0 0 0 1px rgba(255, 215, 0, 0.2),
                  inset 0 0 20px rgba(255, 215, 0, 0.1)
                `,
              }}
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
              <Image
                src="/media/logo.png"
                style={{ objectFit: "contain" }}
                alt="Casino Icon"
                width={80}
                height={80}
              />
            </motion.div>
            <Typography
              style={{ fontFamily: kalnia.style.fontFamily }}
              variant="h1"
              component="h1"
              gutterBottom
            >
              DURAK
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Join or create a multiplayer card game room
            </Typography>
          </Box>

          {/* Connection Status */}
          <Box mb={4} textAlign="center">
            <Chip
              label={isConnected ? "Connected to Server" : "Connecting..."}
              color={isConnected ? "success" : "warning"}
              variant="outlined"
            />
          </Box>

          {/* Character Warning */}
          {!hasCharacter && (
            <Alert severity="warning" sx={{ mb: 4, textAlign: "center" }}>
              You need to create a character before you can create or join
              rooms.
            </Alert>
          )}

           {/* Action Buttons */}
           <Stack direction="row" spacing={3} justifyContent="center" mb={4}>
             <motion.div
               whileHover={{ scale: hasCharacter ? 1.05 : 1 }}
               whileTap={{ scale: hasCharacter ? 0.95 : 1 }}
             >
               <Button
                 variant="contained"
                 size="large"
                 startIcon={hasCharacter ? <PlayArrowIcon /> : <LockIcon />}
                 onClick={handleCreateRoom}
                 disabled={!hasCharacter}
                 sx={{ minWidth: 200 }}
               >
                 Create Room
               </Button>
             </motion.div>
             <motion.div
               whileHover={{ scale: hasCharacter ? 1.05 : 1 }}
               whileTap={{ scale: hasCharacter ? 0.95 : 1 }}
             >
               <Button
                 variant="outlined"
                 size="large"
                 startIcon={hasCharacter ? <PersonAddIcon /> : <LockIcon />}
                 onClick={handleJoinRoom}
                 disabled={!hasCharacter}
                 sx={{ minWidth: 200 }}
               >
                 Join Room
               </Button>
             </motion.div>
           </Stack>

           {/* How to Play Button */}
           <Box textAlign="center" mb={4}>
             <motion.div
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               <Button
                 variant="outlined"
                 size="large"
                 startIcon={<HelpIcon />}
                 onClick={() => setHowToPlayOpen(true)}
                 sx={{
                   borderColor: '#FFD700',
                   color: '#FFD700',
                   '&:hover': {
                     borderColor: '#FFD700',
                     backgroundColor: 'rgba(255, 215, 0, 0.1)',
                   },
                 }}
               >
                 How to Play
               </Button>
             </motion.div>
           </Box>
            </motion.div>
          </Box>
        </Container>

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes goldenBorder {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>

      {/* Card Images at Bottom Corners */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {/* Left Card - Crosses King */}
        <motion.div
          style={{
            position: "fixed",
            bottom: -80,
            left: -200,
            width: "650px",
            height: "800px",
          }}
          animate={{
            filter: [
              "brightness(1)",
              "brightness(1.1)",
              "brightness(0.9)",
              "brightness(1)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/media/peaks_king.png"
            alt="Peaks King"
            width={300}
            height={450}
            style={{
              borderRadius: "15px",
              objectFit: "contain",
              width: "100%",
              height: "100%",
            }}
          />
        </motion.div>

        {/* Right Card - Peaks King */}
        <motion.div
          style={{
            position: "fixed",
            bottom: -80,
            right: -200,

            width: "650px",
            height: "830px",
          }}
          animate={{
            filter: [
              "brightness(1)",
              "brightness(1.1)",
              "brightness(0.9)",
              "brightness(1)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <Image
            src="/media/crosses_king.png"
            alt="Crosses King"
            width={400}
            height={550}
            style={{
              borderRadius: "15px",
              objectFit: "contain",
              width: "100%",
              height: "100%",
            }}
          />
         </motion.div>
       </Box>

       {/* How to Play Modal */}
       <Dialog
         open={howToPlayOpen}
         onClose={() => setHowToPlayOpen(false)}
         maxWidth="md"
         fullWidth
         PaperProps={{
           sx: {
             background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%)',
             border: '2px solid #FFD700',
             borderRadius: '20px',
             boxShadow: '0 20px 40px rgba(255, 215, 0, 0.3)',
           },
         }}
       >
         <DialogTitle
           sx={{
             color: '#FFD700',
             textAlign: 'center',
             fontSize: '2rem',
             fontWeight: 'bold',
             borderBottom: '1px solid #FFD700',
             pb: 2,
           }}
         >
           How to Play DURAK
         </DialogTitle>
         <DialogContent sx={{ color: 'white', pt: 3 }}>
           <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', mb: 2 }}>
             Game Overview
           </Typography>
           <Typography paragraph>
             Durak is a Russian card game where the objective is to get rid of all your cards. 
             The last player with cards becomes the "durak" (fool).
           </Typography>

           <Divider sx={{ borderColor: '#FFD700', my: 3 }} />

           <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', mb: 2 }}>
             Basic Rules
           </Typography>
           <List>
             <ListItem>
               <ListItemText
                 primary="Game Setup"
                 secondary="2-6 players. Each player starts with 6 cards. One trump suit is chosen."
               />
             </ListItem>
             <ListItem>
               <ListItemText
                 primary="Attack Phase"
                 secondary="The attacker plays a card. The defender must play a higher card of the same suit or a trump card."
               />
             </ListItem>
             <ListItem>
               <ListItemText
                 primary="Defense"
                 secondary="If you can't defend, you must take all cards on the table and it becomes the next player's turn."
               />
             </ListItem>
             <ListItem>
               <ListItemText
                 primary="Drawing Cards"
                 secondary="After each turn, players draw cards from the deck until they have 6 cards (or until the deck is empty)."
               />
             </ListItem>
           </List>

           <Divider sx={{ borderColor: '#FFD700', my: 3 }} />

           <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', mb: 2 }}>
             Winning
           </Typography>
           <Typography paragraph>
             The first player to get rid of all their cards wins! The last player with cards is the "durak" and loses the game.
           </Typography>

           <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', mb: 2 }}>
             Card Rankings
           </Typography>
           <Typography paragraph>
             Cards rank from lowest to highest: 7, 8, 9, 10, Jack, Queen, King, Ace. Trump cards beat any non-trump card.
           </Typography>
         </DialogContent>
         <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
           <Button
             onClick={() => setHowToPlayOpen(false)}
             variant="contained"
             startIcon={<CloseIcon />}
             sx={{
               backgroundColor: '#FFD700',
               color: '#000',
               '&:hover': {
                 backgroundColor: '#FFC107',
               },
             }}
           >
             Close
           </Button>
         </DialogActions>
       </Dialog>
     </>
   );
 }
