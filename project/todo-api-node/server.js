const express = require('express');
const todoController = require('./controllers/todoController');
const authController = require('./controllers/authController');
const router = express.Router()

const app = express();
const port = process.env.PORT || 4040;

app.use(express.json());

router.get('/', function (req, res) {
    res.send('Welcome to the Todo API');
});

// Define routes for authentication
router.post('/login', authController.login);
router.post('/register', authController.register);

// Define routes for the todo API
router.get('/todo', todoController.get);           
router.get('/todo/:id', todoController.getById);   
router.post('/todo', todoController.post);    

app.use('/', router);
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});