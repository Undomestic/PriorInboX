const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  console.log('✅ Received request');
  res.json({ message: 'test' });
  console.log('✅ Response sent');
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});
