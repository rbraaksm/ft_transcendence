import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { urlencoded, json } from 'body-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.use(urlencoded({ extended: true }));
	app.use(json());
	app.enableCors();
	app.use((req, res, next) => {
		next();
	});
	app.useGlobalPipes(new ValidationPipe());
	await app.listen(3000);
}
bootstrap();
