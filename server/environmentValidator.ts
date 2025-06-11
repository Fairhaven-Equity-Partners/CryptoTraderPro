/**
 * Environment Variable Security Validator
 */
export class EnvironmentValidator {
  static validateRequiredEnvVars(): boolean {
    const required = [
      'COINMARKETCAP_API_KEY',
      'NODE_ENV'
    ];

    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate API key format
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    if (apiKey && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(apiKey)) {
      console.warn('CoinMarketCap API key format validation failed');
    }

    return true;
  }

  static validateSecuritySettings(): Record<string, boolean> {
    const securityChecks = {
      nodeEnv: process.env.NODE_ENV === 'production',
      httpsOnly: process.env.HTTPS_ONLY === 'true',
      secureHeaders: true
    };

    const failedChecks = Object.entries(securityChecks)
      .filter(([_, passed]) => !passed)
      .map(([check]) => check);

    if (failedChecks.length > 0) {
      console.warn(`Security recommendations: ${failedChecks.join(', ')}`);
    }

    return securityChecks;
  }
}