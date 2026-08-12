const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(passport.initialize());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { status: 'fail', message: 'Too many login attempts. Please try again later.' } });
app.use(['/auth/login', '/api/auth/login'], loginLimiter);

app.get(['/health', '/api/health'], (req, res) => res.status(200).json({ status: 'success' }));
app.use(['/auth', '/api/auth'], authRoutes);
app.use(['/tasks', '/api/tasks'], taskRoutes);
app.all('*', (req, res, next) => next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404)));
app.use(errorHandler);

module.exports = app;
