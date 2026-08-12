const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests only Monday–Friday, between 09:00 (inclusive) and 17:00 (exclusive).
function workingHoursOnly(req, res, next) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHour = hour >= 9 && hour < 17;

  if (isWeekday && isWorkingHour) return next();

  return res.status(403).sendFile(path.join(__dirname, 'public', 'closed.html'));
}

app.use(workingHoursOnly);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'public', 'services.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
