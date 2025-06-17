/**
 * PRODUCTION DEPLOYMENT CONFIGURATION
 * Optimized server setup for production environment
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export function createProductionServer() {
  const app = express();
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
  }));

  // Compression for better performance
  app.use(compression());

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: true,
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      features: {
        adaptiveWeightManager: true,
        marketRegimeDetector: true,
        confluenceAnalysisEngine: true,
        bigNumberPrecision: true,
        signalGeneration: true
      }
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Production error:', err);
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: true,
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

export const productionConfig = {
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true',
    cert: process.env.SSL_CERT_PATH,
    key: process.env.SSL_KEY_PATH
  },
  monitoring: {
    enabled: true,
    healthCheck: '/api/health',
    metricsPath: '/metrics'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    requestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true'
  }
};