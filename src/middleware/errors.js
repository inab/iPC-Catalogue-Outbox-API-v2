import winston from 'winston';

module.exports = function(err, req, res, next){
  winston.error(err.message, err);
  // Dynamic setting of the HTTP status code.
  res.status(err.status)
  // And, then, send the response.
  res.json({ message: err.message })
}
