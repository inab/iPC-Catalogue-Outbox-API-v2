import winston from 'winston';

module.exports = function() {
  winston.handleExceptions(
    // We define two transport layers for errors: Console & File
    new winston.transports.Console({ colorize: true, prettyPrint: true }),
    new winston.transports.File({ filename: 'uncaughtExceptions.log' }));
  
  // We define an event listener for Rejections which are outside the Express runtime.
  // We throw an exception when a rejection occurs (promises-async), that can be handled by Winston.
  process.on('unhandledRejection', (ex) => {
    throw ex;
  });
  
  winston.add(winston.transports.File, { filename: 'outbox-api-errors.log' }); 
}