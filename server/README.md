# Card Game Backend

A comprehensive backend for a multiplayer card game (Fool's Game) built with NestJS, PostgreSQL, and WebSockets.

## Features

- **Room Management**: Create and join game rooms
- **Real-time Communication**: WebSocket-based game updates
- **Card Game Logic**: Complete implementation of Fool's Game rules
- **Database Integration**: PostgreSQL with Sequelize ORM
- **REST API**: Full REST endpoints for game management

## Game Rules

This implementation follows the classic "Fool's Game" (Durak) rules:

1. **Setup**: 2-6 players, 32-card deck (7-A in all suits)
2. **Dealing**: Each player gets 6 cards initially
3. **Trump**: Last card in deck determines trump suit
4. **Attacking**: Players attack with cards, defenders must beat them
5. **Defending**: Use higher rank cards or trump to defend
6. **Winning**: First player to get rid of all cards wins

## Card Naming Convention

Cards use short names for efficient communication:
- **Format**: `{Rank}{Suit}` (e.g., "KS" = King of Spades)
- **Ranks**: 7, 8, 9, T (10), J, Q, K, A
- **Suits**: S (Spades), H (Hearts), D (Diamonds), C (Clubs)

## API Endpoints

### Rooms
- `POST /rooms` - Create a new room
- `POST /rooms/join` - Join an existing room
- `GET /rooms` - Get all rooms
- `GET /rooms/:id` - Get specific room
- `POST /rooms/:id/start` - Start game in room

### Game
- `POST /game/action` - Process game action
- `POST /game/state` - Get current game state

## WebSocket Events

### Client to Server
- `join-room` - Join a game room
- `leave-room` - Leave a game room
- `start-game` - Start the game (room owner only)
- `game-action` - Perform game action (attack, defend, pass, etc.)

### Server to Client
- `room-joined` - Confirmation of joining room
- `room-left` - Confirmation of leaving room
- `player-joined` - Notification of new player
- `player-left` - Notification of player leaving
- `game-started` - Game has started
- `game-state-updated` - Game state changed
- `game-ended` - Game finished
- `error` - Error message

## Game Actions

### Attack
```json
{
  "type": "attack",
  "card": { "suit": "S", "rank": "K", "shortName": "KS" },
  "roomId": "room-id",
  "playerId": "player-id"
}
```

### Defend
```json
{
  "type": "defend",
  "card": { "suit": "S", "rank": "K", "shortName": "KS" },
  "defendingCard": { "suit": "H", "rank": "A", "shortName": "AH" },
  "roomId": "room-id",
  "playerId": "player-id"
}
```

### Pass
```json
{
  "type": "pass",
  "roomId": "room-id",
  "playerId": "player-id"
}
```

### Take Cards
```json
{
  "type": "take_cards",
  "roomId": "room-id",
  "playerId": "player-id"
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database

3. Configure environment variables (copy `env.example` to `.env`):
```bash
cp env.example .env
```

4. Update database configuration in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=card_game
```

5. Start the application:
```bash
npm run start:dev
```

## Database Schema

### Rooms Table
- `id` (UUID) - Primary key
- `name` (String) - Room name
- `owner` (String) - Owner player name
- `playerLimit` (Integer) - Maximum players (2-6)
- `playerNames` (JSON) - Allowed player names
- `activeCards` (JSON) - Cards currently on table
- `currentGameStatus` (Enum) - waiting/playing/finished
- `currentAttacker` (String) - Current attacker ID
- `currentDefender` (String) - Current defender ID
- `deck` (JSON) - Remaining deck cards
- `trumpSuit` (String) - Current trump suit
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Players Table
- `id` (UUID) - Primary key
- `name` (String) - Player name
- `status` (Enum) - waiting/attacker/defender/spectator/eliminated
- `role` (Enum) - owner/player
- `cards` (JSON) - Player's current cards
- `socketId` (String) - WebSocket connection ID
- `roomId` (UUID) - Foreign key to rooms
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Game Flow

1. **Room Creation**: Owner creates room with player list
2. **Player Joining**: Players join using their names
3. **Game Start**: Owner starts game, cards are dealt
4. **Gameplay**: Players take turns attacking/defending
5. **Round Management**: Automatic turn progression
6. **Win Condition**: First player with no cards wins

## Error Handling

The API provides comprehensive error handling:
- Validation errors for invalid actions
- Game state errors for out-of-turn actions
- Database errors for missing resources
- WebSocket errors for connection issues

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up reverse proxy (nginx)
4. Use PM2 for process management

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages