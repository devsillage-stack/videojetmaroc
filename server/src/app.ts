import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import clientsRoutes from './modules/clients/clients.routes.js';
import machinesRoutes from './modules/machines/machines.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import quotesRoutes from './modules/quotes/quotes.routes.js';
import invoicesRoutes from './modules/invoices/invoices.routes.js';
import contractsRoutes from './modules/contracts/contracts.routes.js';
import opportunitiesRoutes from './modules/opportunities/opportunities.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import currenciesRoutes from './modules/currencies/currencies.routes.js';
import auditsRoutes from './modules/audits/audits.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import competitorsRoutes from './modules/competitors/competitors.routes.js';
import fleet360Routes from './modules/fleet360/fleet360.routes.js';
import planningRoutes from './modules/planning/planning.routes.js';
import purchasingRoutes from './modules/purchasing/purchasing.routes.js';
import exportsRoutes from './modules/exports/exports.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';


// Polyfill BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan('dev'));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      system: 'VIDEOJET MAROC INDUSTRIAL PLATFORM',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/machines', machinesRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/quotes', quotesRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/contracts', contractsRoutes);
  app.use('/api/opportunities', opportunitiesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/currencies', currenciesRoutes);
  app.use('/api/audits', auditsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/competitors', competitorsRoutes);
  app.use('/api/fleet360', fleet360Routes);
  app.use('/api/planning', planningRoutes);
  app.use('/api/purchasing', purchasingRoutes);
  app.use('/api/exports', exportsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/settings', settingsRoutes);


  // Serve frontend static assets in production or when client/dist exists
  const clientDistCandidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ];
  const distPath = clientDistCandidates.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

  if (distPath) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Fallback for unmatched API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint API introuvable' });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
};

