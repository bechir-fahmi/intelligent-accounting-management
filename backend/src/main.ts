import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
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
  
  // Use class serializer interceptor globally
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get('Reflector')));
  
  // Enable CORS with support for multiple origins
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  app.enableCors({
    origin: corsOrigins,
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
