const express = require('express'); // Import Express
const morgan = require('morgan'); // Import Morgan for logging requests
const app = express(); // Initialize Express app

let topMovies = [
    {
        title: 'Enter the Dragon',
        producer: 'Raymond Chow',
        year: 1973
    },
    {
        title: 'Drunken Master',
        producer: 'Willie Chan',
        year: 1978
    },
    {
        title: 'Crouching Tiger, Hidden Dragon',
        producer: 'Bill Kong',
        year: 2000
    },
    {
        title: 'Ip Man',
        producer: 'Raymond Wong',
        year: 2008
    },
    {
        title: 'The 36th Chamber of Shaolin',
        producer: 'Runme Shaw',
        year: 1978
    },
    {
        title: 'Once Upon a Time in China',
        producer: 'Tsui Hark',
        year: 1991
    },
    {
        title: 'Ong Bak: The Thai Warrior ',
        producer: 'Prachya Pinkaew',
        year: 2003
    },
    {
        title: 'Kung Fu Hustle',
        producer: 'Raymond Wong',
        year: 2004
    },    
    {
        title: 'The Way of the Dragon',
        producer: 'Bruce Lee',
        year: 1972
    },
    {
        title: 'The Monkey King',
        producer: 'Stephen Chow',
        year: 2014
    }        
];

app.use(morgan('combined')); // Use morgan middleware to log requests
app.use(express.static('public')); // Automatically serve all static files from "public"-folder

app.get('/', (req, res) => {
    res.send(`Welcome to DojoDB - Let's kick things off!`) // Sends response text for root - endpoint
});

app.get('/movies', (req, res) => {
    res.json(topMovies); // Sends movie list as JSON response for /movies - endpoint
});

app.listen(3000, () => { // Start server on port 3000
    console.log('Your server is running on port 3000');
});
