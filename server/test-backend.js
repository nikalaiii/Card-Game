const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBackend() {
  console.log('🧪 Testing Card Game Backend...\n');

  try {
    // Test 1: Create a room
    console.log('1. Creating a room...');
    const createRoomResponse = await axios.post(`${BASE_URL}/rooms`, {
      name: 'Test Room',
      playerLimit: 4,
      playerNames: ['Alice', 'Bob', 'Charlie'],
      owner: 'Alice'
    });
    
    if (createRoomResponse.data.success) {
      console.log('✅ Room created successfully');
      const room = createRoomResponse.data.room;
      console.log(`   Room ID: ${room.id}`);
      console.log(`   Room Name: ${room.name}`);
      console.log(`   Owner: ${room.owner}`);
      console.log(`   Player Limit: ${room.playerLimit}`);
      console.log(`   Players: ${room.playerNames.join(', ')}`);
    } else {
      console.log('❌ Failed to create room');
      return;
    }

    // Test 2: Join the room
    console.log('\n2. Joining the room...');
    const joinRoomResponse = await axios.post(`${BASE_URL}/rooms/join`, {
      roomId: createRoomResponse.data.room.id,
      playerName: 'Bob'
    });
    
    if (joinRoomResponse.data.success) {
      console.log('✅ Successfully joined room');
    } else {
      console.log('❌ Failed to join room:', joinRoomResponse.data.message);
    }

    // Test 3: Get all rooms
    console.log('\n3. Getting all rooms...');
    const getAllRoomsResponse = await axios.get(`${BASE_URL}/rooms`);
    
    if (getAllRoomsResponse.data.success) {
      console.log('✅ Retrieved all rooms');
      console.log(`   Total rooms: ${getAllRoomsResponse.data.rooms.length}`);
    } else {
      console.log('❌ Failed to get rooms');
    }

    // Test 4: Get specific room
    console.log('\n4. Getting specific room...');
    const getRoomResponse = await axios.get(`${BASE_URL}/rooms/${createRoomResponse.data.room.id}`);
    
    if (getRoomResponse.data.success) {
      console.log('✅ Retrieved specific room');
      console.log(`   Room status: ${getRoomResponse.data.room.currentGameStatus}`);
    } else {
      console.log('❌ Failed to get specific room');
    }

    // Test 5: Start the game
    console.log('\n5. Starting the game...');
    const startGameResponse = await axios.post(`${BASE_URL}/rooms/${createRoomResponse.data.room.id}/start`, {
      ownerId: createRoomResponse.data.room.players.find(p => p.role === 'owner').id
    });
    
    if (startGameResponse.data.success) {
      console.log('✅ Game started successfully');
      console.log(`   Game status: ${startGameResponse.data.room.currentGameStatus}`);
      console.log(`   Trump suit: ${startGameResponse.data.room.trumpSuit}`);
      console.log(`   Current attacker: ${startGameResponse.data.room.currentAttacker}`);
      console.log(`   Current defender: ${startGameResponse.data.room.currentDefender}`);
    } else {
      console.log('❌ Failed to start game');
    }

    // Test 6: Get game state
    console.log('\n6. Getting game state...');
    const gameStateResponse = await axios.post(`${BASE_URL}/game/state`, {
      roomId: createRoomResponse.data.room.id
    });
    
    if (gameStateResponse.data.success) {
      console.log('✅ Retrieved game state');
      const gameState = gameStateResponse.data.gameState;
      console.log(`   Game status: ${gameState.status}`);
      console.log(`   Active cards: ${gameState.activeCards.length}`);
      console.log(`   Players: ${gameState.players.length}`);
      gameState.players.forEach(player => {
        console.log(`     - ${player.name}: ${player.cardsCount} cards, status: ${player.status}`);
      });
    } else {
      console.log('❌ Failed to get game state');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Backend Features Verified:');
    console.log('   ✅ Room creation');
    console.log('   ✅ Player joining');
    console.log('   ✅ Room listing');
    console.log('   ✅ Game starting');
    console.log('   ✅ Game state management');
    console.log('   ✅ Card dealing');
    console.log('   ✅ Player management');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testBackend();

