import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { __DEV__ } from './helpers/constant';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableShutdownHooks()
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
