import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  console.log('🚀 Starting Card Game Server...');

  console.log(
    'ENV DB:',
    process.env.DB_HOST,
    process.env.DB_PORT,
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
  );

  try {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    await app.listen(process.env.PORT ?? 3000);
    console.log(`🎮 Card Game Server is running on: ${await app.getUrl()}`);
    console.log(`📡 WebSocket available at: ${await app.getUrl()}`);
    console.log(`🗄️  Database: PostgreSQL on localhost:5432`);
    console.log(`📊 Database will be created automatically by Sequelize`);
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('💡 Make sure PostgreSQL is running: docker ps');
    console.log('💡 If not running, start it with: npm run db:start');
    process.exit(1);
  }
}
bootstrap();
