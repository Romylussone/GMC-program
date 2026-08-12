const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const days = Number(process.env.COOKIE_EXPIRES_IN || 7);
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  });

  const safeUser = { id: user.id, name: user.name, email: user.email };
  res.status(statusCode).json({ status: 'success', user: safeUser });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return next(new AppError('Name, email, and password are required.', 400));
  const user = await User.create({ name, email, password });
  sendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Email and password are required.', 400));
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.password || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  sendToken(user, 200, res);
});

exports.googleCallback = (req, res) => sendToken(req.user, 200, res);

exports.logout = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.status(204).send();
};
