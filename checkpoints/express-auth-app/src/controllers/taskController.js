const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createTask = catchAsync(async (req, res, next) => {
  const { title, description, completed } = req.body;
  if (!title) return next(new AppError('A task title is required.', 400));
  const task = await Task.create({ title, description, completed, owner: req.user.id });
  res.status(201).json({ status: 'success', data: { task } });
});

exports.getTasks = catchAsync(async (req, res) => {
  const tasks = await Task.find({ owner: req.user.id }).sort('-createdAt');
  res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  // Include owner in the query: an existing task belonging to another user is indistinguishable from absent.
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!task) return next(new AppError('Task not found.', 404));
  res.status(204).send();
});
