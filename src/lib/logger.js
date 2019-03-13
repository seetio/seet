const winston   = require('winston');
const logger    = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
    ]
});

module.exports = {
    info: (message) => logger.log({ level: 'info', message }),
    error: (message) => logger.log({ level: 'error', message }),
};
