const express = require('express');     // Import Express
const morgan = require('morgan');     // Import Morgan for logging requests
const fs = require('fs');     // Import built-in modules fs to help to create and append logs
const uuid = require('uuid');    // uuid package to generate unique IDs
const path = require('path');     // Import built-in modules path to help file paths work
const app = express();     // Initialize Express app
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});     // Create a write stream (in append mode) and create a 'log.txt' file in the root directory. Appended via path.join

let topMovies = [
    {
        title: 'Enter the Dragon',
        description: `Bruce Lee stars as a martial artist recruited by a secret British agency to infiltrate a crime lord's island fortress for a deadly tournament. This classic is one of the most influential martial arts films ever.`,
        genre: ['Action'],
        imgURL: '',
        featured: true,
        director: {
            name:'Robert Clouse',
            bio: `Robert Clouse was an American film director, best known for his martial arts films, most notably Enter the Dragon.`,
            birthYear: 1928,
            deathYear:1997
        }
    },
    {
        title: 'Drunken Master',
        description: `Jackie Chan stars as a young man who learns the unconventional Drunken Fist style of kung fu. The film mixes humor with martial arts in a unique blend that became a hallmark of Chan's career.`,
        genre: ['Action', 'Comedy'],
        imgURL: '',
        featured: true,
        director: {
            name:'Yuen Woo-Ping',
            bio: `Yuen Woo-ping is a Hong Kong martial arts film director, choreographer, and producer. He is renowned for his work on action choreography in films like The Matrix and Crouching Tiger, Hidden Dragon.`,
            birthYear: 1945,
            deathYear:null
        }
    },
    {
        title: 'Crouching Tiger, Hidden Dragon',
        description: `This epic film tells the story of a stolen sword, forbidden love, and a martial arts journey. It blends action with deep emotional storytelling.`,
        genre: ['Action', 'Drama', 'Adventure'],
        imgURL: '',
        featured: true,
        director: {
            name:'Ang Lee',
            bio: `Ang Lee is a Taiwanese-American filmmaker known for his versatile approach to storytelling. His work often explores themes of identity and human emotion.`,
            birthYear: 1954,
            deathYear:null
        }
    },
    {
        title: 'Ip Man',
        description: `The story of Ip Man, a legendary martial artist and the teacher of Bruce Lee. Set during the Japanese occupation of China, it explores his fight for dignity and justice.`,
        genre: ['Action', 'Biography', 'Drama'],
        imgURL: '',
        featured: true,
        director: {
            name:'Wilson Yip',
            bio: `Wilson Yip is a Hong Kong film director known for his work on martial arts films, particularly the Ip Man series.`,
            birthYear: 1963,
            deathYear:null
        }
    },
    {
        title: 'The 36th Chamber of Shaolin',
        description: `A young man seeks revenge for his family's death and trains at the Shaolin Temple, mastering the martial arts techniques that help him defeat his enemies.`,
        genre: ['Action', 'Drama'],
        imgURL: '',
        featured: true,
        director: {
            name:'Lau Kar-leung',
            bio: `Lau Kar-leung was a renowned Hong Kong martial arts filmmaker, actor, and choreographer. He is considered one of the best in martial arts film history.`,
            birthYear: 1934,
            deathYear:2013
        }
    },
    {
        title: 'Kung Fu Hustle',
        description: `A comedic action film that blends martial arts with slapstick humor. It is set in a 1940s Chinese neighborhood where a small-time gangster tries to prove himself.`,
        genre: ['Action', 'Comedy'],
        imgURL: '',
        featured: true,
        director: {
            name:'Stephen Chow',
            bio: `Stephen Chow is a Hong Kong filmmaker, actor, and producer. He is known for his unique blend of comedy and martial arts in films like Kung Fu Hustle.`,
            birthYear: 1962,
            deathYear:null
        }
    },
    {
        title: 'The Way of the Dragon',
        description: `Bruce Lee directs and stars in this film as a martial artist who fights against a local gang and defends his family, culminating in an iconic battle against Chuck Norris in the Colosseum.`,
        genre: ['Action', 'Comedy'],
        imgURL: '',
        featured: true,
        director: {
            name:'Bruce Lee',
            bio: `Bruce Lee was a martial artist, actor, and film director. He is widely regarded as one of the most influential martial artists of all time.`,
            birthYear: 1940,
            deathYear:1973
        }
    },
    {
        title: 'The Monkey King',
        description: `A fantasy adventure film based on the Chinese classic Journey to the West, following the Monkey King as he battles gods, demons, and discovers his true powers.`,
        genre: ['Action', 'Adventure', 'Fantasy'],
        imgURL: '',
        featured: false,
        director: {
            name:'Soi Cheang',
            bio: 'Soi Cheang is a Hong Kong director and screenwriter known for his work in both action and fantasy genres.',
            birthYear: 1971,
            deathYear:null
        }
    },   
    {
        title: 'Ong Bak: The Thai Warrior',
        description: `A young Thai man travels to Bangkok to recover a stolen artifact and uncovers a plot involving criminals and corruption. The film is known for its intense martial arts sequences.`,
        genre: ['Action', 'Thriller'],
        imgURL: '',
        featured: true,
        director: {
            name:'Prachya Pinkaew',
            bio: 'Prachya Pinkaew is a Thai director best known for his action-packed films, particularly his work on Ong Bak and its sequels.',
            birthYear: 1962,
            deathYear:null
        }
    },
    {
        title: 'Once Upon a Time in China',
        description: `Jet Li stars as the legendary martial artist Wong Fei-hung, defending the country and upholding justice during a turbulent time in late 19th-century China.`,
        genre: ['Action', 'Drama'],
        imgURL: '',
        featured: true,
        director: {
            name:'Tsui Hark',
            bio: 'Tsui Hark is a Hong Kong filmmaker, producer, and screenwriter known for his groundbreaking work in the martial arts genre.',
            birthYear: 1951,
            deathYear:null
        }
    },      
];
let genres = [
    {
        name: 'Action',
        description: `High-energy films packed with intense fight scenes, fast-paced choreography, and adrenaline-pumping sequences that showcase the power and skill of martial artists in combat.`,
    },
    {
        name: 'Adventure',
        description: `Action-packed martial arts stories set in exotic locations, where heroes embark on perilous quests, fight powerful foes, and explore new cultures while honing their fighting skills.`,
    },
    {
        name: 'Biography',
        description: `Inspirational stories based on the lives of real-life martial artists, focusing on their struggles, triumphs, and the personal experiences that led them to become legends in their craft.`,
    },
    {
        name: 'Comedy',
        description: `Light-hearted martial arts films with humor, slapstick fighting scenes, and exaggerated action, where the emphasis is on fun and entertaining antics rather than serious combat.`,
    },
    {
        name: 'Drama',
        description: `Martial arts movies with emotional depth, exploring personal struggles, growth, and complex relationships, often focusing on a martial artist's journey of self-discovery and redemption.`,
    },
    {
        name: 'Fantasy',
        description: `Martial arts set in magical or mythical worlds, where fighters wield extraordinary abilities, face mythical creatures, and engage in epic battles beyond the limits of reality.`,
    },
    {
        name: 'Thriller',
        description: `Suspenseful martial arts films that keep viewers on the edge of their seats with intense fight sequences, mind games, and dangerous confrontations, often featuring skilled fighters overcoming dark forces.`,
    }
];    
let users = [];  // To store user data

app.use(morgan('combined', {stream: accessLogStream}));     // Use morgan middleware to log requests and view logs in log.txt
app.use(express.static('public'));     // Automatically serve all static files from "public"-folder
app.use(express.json());     // JSON middleware to parse JSON data

app.get('/', (req, res) => {
    res.send(`Welcome to DojoDB - Let's kick things off!`)     // Sends response text for root - endpoint
});

// Get list of all movies
app.get('/movies', (req, res) => {     
    res.json(topMovies);     // Sends the whole array as JSON
});

// Get data about specific movie by title
app.get('/movies/:title', (req, res) => {     
    const movieTitle = req.params.title.trim().toLowerCase();     // Get cleaned-up title from URL
    const movie = topMovies.find(m => m.title.trim().toLowerCase() === movieTitle);     // Find movie that matches 
    if(movie) {
        res.json(movie);     //Return movie data as JSON
    } else {
        res.status(404).send(`Movie with title "${title}" not found.`);    // Error message
    }
});

// Get data about a genre by name
app.get('/movies/genres/:genre', (req, res) => {    
    const genre = req.params.genre.trim().toLowerCase();     // Get cleaned-up genre from URL
    const genreDetails = genres.find(g => g.name.trim().toLowerCase() === genre);    // Find genre that matches
    if(genreDetails) {
        res.json(genreDetails);   // Return genre details
    } else {
        res.status(404).send(`Genre "${genre}" not found.`);   // Error message if no genre is found
    }
});

// Get data about a director by name
app.get('/movies/directors/:director', (req, res) => {     
    const directorName = req.params.director.trim().toLowerCase();     // Get cleaned-up director name from URL
    const directorDetails = topMovies
        .map(movie => movie.director)
        .find(director => director.name.trim().toLowerCase() === directorName);     // Find director in topMovies array
    if (directorDetails) {
        res.json(directorDetails);
    } else {
        res.status(404).send(`Director "${directorName}" not found.`);   // Error message 
    }
});

// Add new user
app.post('/users', (req, res) => {     
    const newUser = req.body;
    if (!newUser.name || !newUser.email) {    // Check if 'name' is provided in request body
        return res.status(400).send('Missing "name" or "email".');   
    }
    const existingUser = users.find(u => u.email === newUser.email || u.name === newUser.name);
    if (existingUser) {     // Check if user with same name or email already exists
        return res.status(400).send(`User with this ${existingUser.email === newUser.email ? 'email' : 'name'} already exists.`);
    }
else {
   newUser.id = uuid.v4();     // Generate unique ID
   users.push(newUser);   // Add user to users array
    res.status(201).send({
        message: `User created with name: ${newUser.name} and email: ${newUser.email}`,
        user: newUser,
        });
    }
});

// Update user info
app.put('/users/:id', (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const updatedUser = req.body;     // Get updated user data
    const user = users.find(u => u.id === userId);  // Find user by ID
    if (!user){
        res.status(404).send(`User with ID "${userId}" not found.`);   // Error message not found
    }
        user.username = updatedUser.username || user.username;  // If username is provided, update it. If not, keep current
        res.status(200).send( {
            message:`User with ID "${userId}" updated successfully.` , username: `${updatedUser.username}`
        }); 
});

// Add movie to user's favourites list
app.post('/users/:id/favourites', (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const movieTitle = req.body.title.trim().toLowerCase();     // Get movie title
    const user = users.find(u => u.id === userId);      // Find user by ID
    const movie = topMovies.find(m => m.title.trim().toLowerCase() === movieTitle);     // Find movie by title
    if (user && movie) {
        if (!user.favourites) {
            user.favourites = [];   // Initialize favourites list (if it doesn't exist)
        }
        const movieExists = user.favourites.some(fav => fav.title.toLowerCase() === movie.title.toLowerCase());  // Check if movie is already in list
        if (movieExists) {
            res.send(`${movie.title} is already in favourites.`);   // Message if already added
        } else {
            user.favourites.push(movie);    // Adds movie to list
            res.send(`${movie.title} added to favourites.`);    // Send success message
        }
    } else {
        res.status(404).send('User or movie not found.');   // Error message 
    }  
});

// Remove movie from user's favourites list
app.delete('/users/:id/favourites/:movieTitle', (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const movieTitle = req.params.movieTitle.trim().toLowerCase();     // Get movie title
    const user = users.find(u => u.id === userId);      // Find user by ID
    if (user) {
        const movieList = user.favourites.filter(fav => fav.title.toLowerCase() !== movieTitle.toLowerCase());    
        if (movieList.length === user.favourites.length) {
            res.status(404).send('Movie not found in favourites.');   // Error message if not in list (no changes made)   
        } else {
            user.favourites = movieList;
            res.send(`${movieTitle} removed from favourites.`);    // Send success message
        }
    } else {
        res.status(404).send('User not found.');
    }
});

// Remove user
app.delete('/users/:id', (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const updatedUsers = users.filter(u => u.id !== userId);
    if(updatedUsers.length === users.length) {
        res.status(404).send('No user was removed.');   // No change was made
    } else {
        users = updatedUsers;   // Update array removing User
    res.send(`User with ID: ${userId} successfully removed.`);     // Send success message
    }
});

// Log errors
app.use((err,req,res,next) => {
    console.error(err.stack);     
    res.status(500).send('Something went wrong at the dojo. Try again later.')     // Send error message
}
);
// Start server on port 3000
app.listen(3000, () => {     
    console.log('Your server is running on port 3000');
});
