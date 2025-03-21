import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  
  // Use cookie parser
  app.use(cookieParser());
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT || 3000);
  
  console.log(`Application running on port ${process.env.PORT || 3000}`);
}
bootstrap();
