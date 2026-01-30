const express = require('express');
const app = express();

const PORT = 3000;

// middleware
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send('Express backend is running 🚀');
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
