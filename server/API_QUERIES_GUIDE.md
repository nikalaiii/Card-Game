# Complete API Queries Guide for Card Game Client

This guide provides all the HTTP requests and WebSocket events needed to interact with the card game server.

## 🚀 Complete Game Flow Example

### Step 1: Create a Room (Player 1 - Alice)

**HTTP Request:**
```http
POST http://localhost:3000/rooms
Content-Type: application/json

{
  "name": "My Game Room",
  "playerLimit": 4,
  "playerNames": ["Alice", "Bob", "Charlie", "David"],
  "owner": "Alice"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": "room-uuid-123",
    "name": "My Game Room",
    "owner": "Alice",
    "playerLimit": 4,
    "playerNames": ["Alice", "Bob", "Charlie", "David"],
    "currentGameStatus": "waiting",
    "players": [
      {
        "id": "player-uuid-1",
        "name": "Alice",
        "role": "owner",
        "status": "waiting",
        "cards": []
      }
    ]
  }
}
```

### Step 2: Connect to WebSocket (Player 1 - Alice)

**WebSocket Connection:**
```javascript
const socket = io('http://localhost:3000');

// Join the room via WebSocket
socket.emit('join-room', {
  roomId: 'room-uuid-123',
  playerName: 'Alice'
});

// Listen for room joined confirmation
socket.on('room-joined', (data) => {
  console.log('Joined room:', data);
});
```

### Step 3: Create Another User and Join Room (Player 2 - Bob)

**HTTP Request:**
```http
POST http://localhost:3000/rooms/join
Content-Type: application/json

{
  "roomId": "room-uuid-123",
  "playerName": "Bob"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined room",
  "room": {
    "id": "room-uuid-123",
    "name": "My Game Room",
    "players": [
      {
        "id": "player-uuid-1",
        "name": "Alice",
        "role": "owner",
        "status": "waiting"
      },
      {
        "id": "player-uuid-2",
        "name": "Bob",
        "role": "player",
        "status": "waiting"
      }
    ]
  }
}
```

**WebSocket Connection (Player 2 - Bob):**
```javascript
const socket2 = io('http://localhost:3000');

socket2.emit('join-room', {
  roomId: 'room-uuid-123',
  playerName: 'Bob'
});

socket2.on('room-joined', (data) => {
  console.log('Bob joined room:', data);
});

// Listen for other players joining
socket2.on('player-joined', (data) => {
  console.log('New player joined:', data.player);
});
```

### Step 4: Start the Game (Room Owner - Alice)

**HTTP Request:**
```http
POST http://localhost:3000/rooms/room-uuid-123/start
Content-Type: application/json

{
  "ownerId": "player-uuid-1"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": "room-uuid-123",
    "currentGameStatus": "playing",
    "currentAttacker": "player-uuid-1",
    "currentDefender": "player-uuid-2",
    "trumpSuit": "S",
    "deck": ["7H", "8H", "9H", ...],
    "players": [
      {
        "id": "player-uuid-1",
        "name": "Alice",
        "cards": ["KS", "7S", "8H", "9D", "TC", "JC"],
        "status": "attacker"
      },
      {
        "id": "player-uuid-2",
        "name": "Bob",
        "cards": ["QS", "KH", "AD", "7C", "8D", "9S"],
        "status": "defender"
      }
    ]
  }
}
```

**WebSocket Event (All Players):**
```javascript
socket.on('game-started', (data) => {
  console.log('Game started!', data.gameState);
  // Update UI with game state
});
```

### Step 5: Game Actions - Attack (Alice)

**WebSocket Event:**
```javascript
// Alice attacks with King of Spades
socket.emit('game-action', {
  type: 'attack',
  card: {
    suit: 'S',
    rank: 'K',
    shortName: 'KS'
  },
  roomId: 'room-uuid-123',
  playerId: 'player-uuid-1'
});
```

**WebSocket Response (All Players):**
```javascript
socket.on('game-state-updated', (gameState) => {
  console.log('Game state updated:', gameState);
  // Update UI with new game state
});
```

### Step 6: Game Actions - Defend (Bob)

**WebSocket Event:**
```javascript
// Bob defends with Ace of Hearts (trump card)
socket2.emit('game-action', {
  type: 'defend',
  card: {
    suit: 'S',
    rank: 'K',
    shortName: 'KS'
  },
  defendingCard: {
    suit: 'H',
    rank: 'A',
    shortName: 'AH'
  },
  roomId: 'room-uuid-123',
  playerId: 'player-uuid-2'
});
```

### Step 7: Game Actions - Pass (Alice)

**WebSocket Event:**
```javascript
// Alice passes after all cards are defended
socket.emit('game-action', {
  type: 'pass',
  roomId: 'room-uuid-123',
  playerId: 'player-uuid-1'
});
```

### Step 8: Game Actions - Take Cards (Bob)

**WebSocket Event:**
```javascript
// Bob takes all active cards if he can't defend
socket2.emit('game-action', {
  type: 'take_cards',
  roomId: 'room-uuid-123',
  playerId: 'player-uuid-2'
});
```

### Step 9: Game Actions - Throw Cards (Other Players)

**WebSocket Event:**
```javascript
// Other players can throw cards with same rank
socket.emit('game-action', {
  type: 'throw_cards',
  card: {
    suit: 'D',
    rank: 'K',
    shortName: 'KD'
  },
  roomId: 'room-uuid-123',
  playerId: 'player-uuid-3'
});
```

## 📋 Complete API Reference

### HTTP Endpoints

#### 1. Create Room
```http
POST /rooms
Content-Type: application/json

{
  "name": "Room Name",
  "playerLimit": 4,
  "playerNames": ["Player1", "Player2", "Player3", "Player4"],
  "owner": "Player1"
}
```

#### 2. Join Room
```http
POST /rooms/join
Content-Type: application/json

{
  "roomId": "room-uuid",
  "playerName": "PlayerName"
}
```

#### 3. Get All Rooms
```http
GET /rooms
```

#### 4. Get Specific Room
```http
GET /rooms/{roomId}
```

#### 5. Start Game
```http
POST /rooms/{roomId}/start
Content-Type: application/json

{
  "ownerId": "player-uuid"
}
```

#### 6. Get Game State
```http
POST /game/state
Content-Type: application/json

{
  "roomId": "room-uuid"
}
```

#### 7. Process Game Action
```http
POST /game/action
Content-Type: application/json

{
  "type": "attack|defend|pass|take_cards|throw_cards",
  "card": { "suit": "S", "rank": "K", "shortName": "KS" },
  "defendingCard": { "suit": "H", "rank": "A", "shortName": "AH" },
  "roomId": "room-uuid",
  "playerId": "player-uuid"
}
```

### WebSocket Events

#### Client to Server Events

**Join Room:**
```javascript
socket.emit('join-room', {
  roomId: 'room-uuid',
  playerName: 'PlayerName'
});
```

**Leave Room:**
```javascript
socket.emit('leave-room', {
  roomId: 'room-uuid',
  playerId: 'player-uuid'
});
```

**Start Game:**
```javascript
socket.emit('start-game', {
  roomId: 'room-uuid',
  playerId: 'player-uuid'
});
```

**Game Action:**
```javascript
socket.emit('game-action', {
  type: 'attack',
  card: { suit: 'S', rank: 'K', shortName: 'KS' },
  roomId: 'room-uuid',
  playerId: 'player-uuid'
});
```

#### Server to Client Events

**Room Joined:**
```javascript
socket.on('room-joined', (data) => {
  // data.success, data.message, data.room
});
```

**Room Left:**
```javascript
socket.on('room-left', (data) => {
  // data.success, data.message
});
```

**Player Joined:**
```javascript
socket.on('player-joined', (data) => {
  // data.player
});
```

**Player Left:**
```javascript
socket.on('player-left', (data) => {
  // data.playerId
});
```

**Game Started:**
```javascript
socket.on('game-started', (data) => {
  // data.roomId, data.gameState
});
```

**Game State Updated:**
```javascript
socket.on('game-state-updated', (gameState) => {
  // Complete game state
});
```

**Game Ended:**
```javascript
socket.on('game-ended', (data) => {
  // data.winner, data.gameState
});
```

**Error:**
```javascript
socket.on('error', (data) => {
  // data.message, data.code
});
```

## 🎮 Complete Client Implementation Example

```javascript
class CardGameClient {
  constructor() {
    this.socket = io('http://localhost:3000');
    this.roomId = null;
    this.playerId = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      this.roomId = data.room.id;
    });

    this.socket.on('game-started', (data) => {
      console.log('Game started:', data.gameState);
      this.updateGameUI(data.gameState);
    });

    this.socket.on('game-state-updated', (gameState) => {
      console.log('Game state updated:', gameState);
      this.updateGameUI(gameState);
    });

    this.socket.on('game-ended', (data) => {
      console.log('Game ended. Winner:', data.winner);
      this.showGameEnd(data.winner);
    });

    this.socket.on('error', (data) => {
      console.error('Game error:', data.message);
    });
  }

  async createRoom(roomName, playerNames, ownerName) {
    try {
      const response = await fetch('http://localhost:3000/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          playerLimit: playerNames.length,
          playerNames: playerNames,
          owner: ownerName
        })
      });
      
      const data = await response.json();
      if (data.success) {
        this.roomId = data.room.id;
        this.playerId = data.room.players.find(p => p.name === ownerName).id;
        
        // Join via WebSocket
        this.socket.emit('join-room', {
          roomId: this.roomId,
          playerName: ownerName
        });
        
        return data.room;
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }

  async joinRoom(roomId, playerName) {
    try {
      const response = await fetch('http://localhost:3000/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId,
          playerName: playerName
        })
      });
      
      const data = await response.json();
      if (data.success) {
        this.roomId = roomId;
        this.playerId = data.room.players.find(p => p.name === playerName).id;
        
        // Join via WebSocket
        this.socket.emit('join-room', {
          roomId: this.roomId,
          playerName: playerName
        });
        
        return data.room;
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  startGame() {
    this.socket.emit('start-game', {
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  attack(card) {
    this.socket.emit('game-action', {
      type: 'attack',
      card: card,
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  defend(attackingCard, defendingCard) {
    this.socket.emit('game-action', {
      type: 'defend',
      card: attackingCard,
      defendingCard: defendingCard,
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  pass() {
    this.socket.emit('game-action', {
      type: 'pass',
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  takeCards() {
    this.socket.emit('game-action', {
      type: 'take_cards',
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  throwCard(card) {
    this.socket.emit('game-action', {
      type: 'throw_cards',
      card: card,
      roomId: this.roomId,
      playerId: this.playerId
    });
  }

  updateGameUI(gameState) {
    // Update your UI with the game state
    console.log('Updating UI with game state:', gameState);
  }

  showGameEnd(winner) {
    // Show game end screen
    console.log(`Game ended! Winner: ${winner}`);
  }
}

// Usage example:
const gameClient = new CardGameClient();

// Create room and start game
gameClient.createRoom('My Room', ['Alice', 'Bob'], 'Alice').then(room => {
  console.log('Room created:', room);
  // Start game after players join
  setTimeout(() => {
    gameClient.startGame();
  }, 2000);
});
```

## 🃏 Card Format Reference

All cards use the short format: `{Rank}{Suit}`

**Ranks:** 7, 8, 9, T (10), J, Q, K, A  
**Suits:** S (Spades), H (Hearts), D (Diamonds), C (Clubs)

**Examples:**
- King of Spades = "KS"
- Seven of Hearts = "7H"
- Ace of Diamonds = "AD"
- Ten of Clubs = "TC"

This guide provides everything you need to implement a complete client for the card game!

