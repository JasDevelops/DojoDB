const express = require('express'); // Import Express
const app = express(); // Initialize Express app

app.get('/movies', (req, res) => {});
app.get('/', (req, res) => {});
app.listen(3000, () => { // Start server on port 3000
    console.log('Your server is running on port 3000');
});
