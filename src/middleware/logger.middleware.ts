import morgan from "morgan";
import { createServiceLogger } from "../utils/logger.util";

const logger = createServiceLogger("MorganMiddleware");

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  { stream }
);

export default morganMiddleware;
