const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware per abilitare CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.json({ OPEN_API_KEY: process.env.OPENAI_API_KEY });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});