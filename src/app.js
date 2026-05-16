import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions API');
  res.json({ message: 'Welcome to the Acquisitions API!' });
});

export default app;
