import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './src/db/index.ts';
import { authRouter } from './src/server/routes/auth.ts';
import { documentsRouter } from './src/server/routes/documents.ts';
import { foldersRouter } from './src/server/routes/folders.ts';
import { usersRouter } from './src/server/routes/users.ts';
import { rolesRouter } from './src/server/routes/roles.ts';
import { auditRouter } from './src/server/routes/audit.ts';
import { statsRouter } from './src/server/routes/stats.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize PGlite database and seed data
  await initDatabase();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'UniVault Repository Core',
      university: 'GSFC University',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/folders', foldersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/stats', statsRouter);

  // Error handling middleware for API
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Static production dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 UniVault Server running on http://0.0.0.0:${PORT}`);
    console.log(`🏢 University: GSFC University`);
    console.log(`🔒 Repository Security: Enabled (PostgreSQL + Owner-Only Deletion)`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
