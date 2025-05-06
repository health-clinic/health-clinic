import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';

const app = express();

const port = parseInt(process.env.APP_PORT || '3000', 10);
const environment = process.env.NODE_ENV || 'development';

app.use(express.json());

const router = express.Router();
router.use(cors());
router.use('/auth', authRouter);

app.use('/api/v1', router);

app.get('/health', (request: Request, response: Response): void => {
  response.json({
    status: 'healthy',
    environment,
    port,
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${port} (listening on 0.0.0.0)`);
});
