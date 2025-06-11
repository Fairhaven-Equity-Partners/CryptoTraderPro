/**
 * Enterprise-Grade Security Middleware
 */
import { Request, Response, NextFunction } from 'express';

export class SecurityEnforcer {
  static setupSecurityMiddleware(app: any) {
    // Security headers
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://api.coinmarketcap.com");
      next();
    });

    // Input sanitization
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.body) {
        req.body = SecurityEnforcer.sanitizeInput(req.body);
      }
      if (req.query) {
        req.query = SecurityEnforcer.sanitizeInput(req.query);
      }
      next();
    });
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+=/gi, '');
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = SecurityEnforcer.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  static validateApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate API key format
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(apiKey))) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    next();
  }
}