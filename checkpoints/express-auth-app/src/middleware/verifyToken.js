const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.verifyToken = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = req.cookies.jwt || (authorization?.startsWith('Bearer ') && authorization.slice(7));

  if (!token) return next(new AppError('You must be logged in to access this resource.', 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('The user for this token no longer exists.', 401));

  req.user = user;
  next();
});
