import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';
import usersRoutes from '#routes/users.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // handles JSON data
app.use(express.urlencoded({ extended: true })); // handles URL-encoded data
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

app.use(securityMiddleware);

// Routes
app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions API');
  res.status(200).json({ message: 'Welcome to the Acquisitions API!' });
});

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req, res) => {
  logger.info('API endpoint requested');
  res.status(200).json({ message: 'Acquisitions API is running!' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

export default app;
