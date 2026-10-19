require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// API routes
app.use('/api', apiRoutes);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  const listener = app.listen(port, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
}

module.exports = app;
