const express = require('express');
const { verifyToken } = require('../middleware/verifyToken');
const { createTask, getTasks, deleteTask } = require('../controllers/taskController');

const router = express.Router();
router.use(verifyToken);
router.route('/').post(createTask).get(getTasks);
router.delete('/:id', deleteTask);

module.exports = router;
