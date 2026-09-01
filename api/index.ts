import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as express from 'express';
import { AppModule } from '../src/app.module';

let serverPromise: Promise<express.Express> | undefined;

function createServer(): Promise<express.Express> {
  if (!serverPromise) {
    const expressApp = express();

    serverPromise = NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn'],
    }).then(async (app) => {
      app.enableCors({
        origin: [
          'https://chumangoapp.cl',
          'https://www.chumangoapp.cl',
          'http://localhost:4200',
        ],
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      });
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
      return expressApp;
    });
  }

  return serverPromise;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await createServer();
  server(req, res);
}
