# Card Game Client

A modern, responsive frontend for the multiplayer card game built with Next.js, Material-UI, and Framer Motion.

## Features

- 🎮 **Real-time multiplayer gameplay** with WebSocket connections
- 🎨 **Beautiful UI** with Material-UI components and animations
- 📱 **Responsive design** that works on desktop and mobile
- ⚡ **Fast and smooth** with Framer Motion animations
- 🔄 **Real-time updates** for game state and player actions

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Material-UI (MUI)** - Component library and theming
- **Framer Motion** - Animation library
- **Axios** - HTTP client for API requests
- **Socket.io** - WebSocket client for real-time communication
- **TypeScript** - Type safety and better developer experience

## Getting Started

### Prerequisites

- Node.js 18+ 
- The server must be running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── create-room/       # Room creation page
│   ├── join-room/         # Room joining page
│   ├── room/[id]/         # Game room page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── theme.ts           # MUI theme configuration
├── components/            # Reusable components
│   ├── CardComponent.tsx  # Card display component
│   ├── GameTable.tsx      # Game table component
│   └── Navigation.tsx     # Navigation bar
├── contexts/              # React contexts
│   └── GameContext.tsx    # Game state management
├── services/              # API and WebSocket services
│   ├── api.service.ts     # HTTP API client
│   └── socket.service.ts  # WebSocket client
└── types/                 # TypeScript type definitions
    └── game.types.ts      # Game-related types
```

## Key Features

### Pages

1. **Home Page** (`/`) - Browse available rooms and create/join games
2. **Create Room** (`/create-room`) - Set up a new game room
3. **Join Room** (`/join-room`) - Join existing rooms by ID or selection
4. **Game Room** (`/room/[id]`) - Play the actual card game

### Components

- **CardComponent** - Displays individual cards with suit and rank
- **GameTable** - Shows the game state, active cards, and player actions
- **Navigation** - Top navigation bar with connection status

### Services

- **ApiService** - Handles all HTTP requests to the server
- **SocketService** - Manages WebSocket connections and events
- **GameContext** - Centralized game state management

## Game Flow

1. **Create/Join Room** - Players create or join game rooms
2. **Wait for Players** - Room owner waits for other players to join
3. **Start Game** - Owner starts the game, cards are dealt
4. **Play** - Players take turns attacking and defending
5. **Win Condition** - First player to empty their hand wins

## Real-time Features

- Live room updates when players join/leave
- Real-time game state synchronization
- Instant card play animations
- Live chat and notifications (future feature)

## Responsive Design

The client is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Material-UI design system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the card game application.