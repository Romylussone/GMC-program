const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.render('home', { page: 'home' }));
app.get('/services', (req, res) => res.render('services', { page: 'services' }));
app.get('/contact', (req, res) => res.render('contact', { page: 'contact', sent: false }));

app.post('/contact', (req, res) => {
  res.render('contact', { page: 'contact', sent: true });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
