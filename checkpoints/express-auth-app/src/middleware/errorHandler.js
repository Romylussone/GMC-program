module.exports = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = { statusCode: 400, message: 'Invalid resource identifier.' };
  if (err.code === 11000) error = { statusCode: 409, message: 'A record with that value already exists.' };
  if (err.name === 'ValidationError') error = { statusCode: 400, message: Object.values(err.errors).map((item) => item.message).join('. ') };
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') error = { statusCode: 401, message: 'Your session is invalid or has expired. Please log in again.' };

  const statusCode = error.statusCode || 500;
  const message = error.isOperational || statusCode < 500 ? error.message : 'Something went wrong.';
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) console.error(err);
  res.status(statusCode).json({ status: `${statusCode}`.startsWith('4') ? 'fail' : 'error', message });
};
