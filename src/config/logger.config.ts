import winston from "winston";
import path from "path";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  const isProduction = env === "production";

  if (isProduction) {
    return "warn";
  } else if (isDevelopment) {
    return "debug"; 
  } else {
    return "info";
  }
};

const getFormat = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";

  if (isDevelopment) {
    return winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    );
  } else {
    // Production: JSON format, no colors
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
  }
};

const getTransports = () => {
  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";

  const transports: any[] = [
    // Console transport
    new winston.transports.Console({
      format: getFormat(),
    }),
  ];

  transports.push(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );

  if (!isProduction || process.env.ENABLE_COMBINED_LOGS === "true") {
    transports.push(
      new winston.transports.File({
        filename: path.join("logs", "combined.log"),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
      })
    );
  }

  return transports;
};

const logger = winston.createLogger({
  level: level(),
  levels,
  format: getFormat(),
  transports: getTransports(),
});

export default logger;
