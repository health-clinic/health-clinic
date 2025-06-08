import express, { Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/authentication';
import appointmentsRouter from './routes/appointments';
import professionalsRouter from './routes/professionals';
import unitsRouter from './routes/units';
import prescriptionsRouter from './routes/prescriptions';
import notificationsRouter from './routes/notifications';

const port = parseInt(process.env.APP_PORT || '3001', 10);
const environment = process.env.NODE_ENV || 'development';

const app = express();

app.use(express.json());

const router = express.Router();
router.use(cors());
router.use('/auth', authRouter);
router.use('/', appointmentsRouter);
router.use('/', professionalsRouter);
router.use('/', unitsRouter);
router.use('/', prescriptionsRouter);
router.use('/', notificationsRouter);

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
