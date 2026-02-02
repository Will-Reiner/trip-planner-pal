import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pool from './config/database';

// Importar rotas
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import mealsRoutes from './routes/meals';
import drinksRoutes from './routes/drinks';
import checklistRoutes from './routes/checklist';
import experienceRoutes from './routes/experience';
import partyThemesRoutes from './routes/partyThemes';
import marketItemsRoutes from './routes/marketItems';
import mealIngredientsRoutes from './routes/mealIngredients';
import expensesRoutes from './routes/expenses';
import ridesRoutes from './routes/rides';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(helmet());

const defaultOrigins = [
  'https://rebolahub.astraflow.io',
  'https://tripback.astraflow.io',
  'http://localhost:8080',
  'http://localhost:5173',
];

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultOrigins;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/drinks', drinksRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/party-themes', partyThemesRoutes);
app.use('/api/market-items', marketItemsRoutes);
app.use('/api/meal-ingredients', mealIngredientsRoutes);
app.use('/api/finances', expensesRoutes);
app.use('/api/rides', ridesRoutes);

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando graciosamente...');
  pool.end(() => {
    console.log('Pool de conexões encerrado');
    process.exit(0);
  });
});

export default app;
