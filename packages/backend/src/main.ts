import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001, () => {
    if (process.send) {
      process.send('ready');
    }
    console.log('application is listening');
  });
}
bootstrap();
