import logger from "../config/logger.config";

export const createServiceLogger = (serviceName: string) => {
  return {
    info: (message: string, meta?: any) => {
      logger.info(`[${serviceName}] ${message}`, meta);
    },
    error: (message: string, meta?: any) => {
      logger.error(`[${serviceName}] ${message}`, meta);
    },
    warn: (message: string, meta?: any) => {
      logger.warn(`[${serviceName}] ${message}`, meta);
    },
    debug: (message: string, meta?: any) => {
      logger.debug(`[${serviceName}] ${message}`, meta);
    },
    http: (message: string, meta?: any) => {
      logger.http(`[${serviceName}] ${message}`, meta);
    },
  };
};

export default logger;
