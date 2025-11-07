"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useGame } from "../contexts/GameContext";
import { useCharacter } from "../contexts/CharacterContext";
import Image from "next/image";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import CreateIcon from "@mui/icons-material/Create";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, currentRoom } = useGame();
  const { character, hasCharacter } = useCharacter();

  const isActive = (path: string) => pathname === path;

  return (
    <AppBar position="static" sx={{ mb: 4, marginBottom: 0 }}>
      <Toolbar>
        <Image
          src="/media/logo.png"
          style={{ objectFit: "contain" }}
          alt="Casino Icon"
          width={50}
          height={50}
        />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Card Game
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={isConnected ? "Connected" : "Disconnected"}
            color={isConnected ? "success" : "error"}
            size="small"
            variant="outlined"
            sx={{ color: "white", borderColor: "white" }}
          />

          {currentRoom && (
            <Chip
              label={`Room: ${currentRoom.name}`}
              color="secondary"
              size="small"
              variant="outlined"
              sx={{ color: "white", borderColor: "white" }}
            />
          )}

          {/* Character Display or Create Button */}
          {hasCharacter && character ? (
            <Box onClick={() => router.push("/create-character")} sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {character.avatar && character.avatar.startsWith('/') ? (
                  <Image src={character.avatar} alt={character.username} width={32} height={32} />
                ) : (
                  character.avatar
                )}
              </Avatar>
              <Chip
                label={`${character.username} (${character.characterType})`}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ color: "white", borderColor: "white" }}
              />
            </Box>
          ) : (
            <Button
              color="inherit"
              startIcon={<CreateIcon />}
              onClick={() => router.push("/create-character")}
              sx={{
                backgroundColor: isActive("/create-character")
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
              }}
            >
              Create Character
            </Button>
          )}

          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => router.push("/")}
            sx={{
              backgroundColor: isActive("/")
                ? "rgba(255,255,255,0.1)"
                : "transparent",
            }}
          >
            Home
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
