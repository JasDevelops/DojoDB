const express = require('express'); // Import Express
const morgan = require('morgan'); // Import Morgan for logging requests
const fs = require('fs'); // Import built-in modules fs to help append logs to a file
const path = require('path'); // Import built-in modeules path to help append logs to a file
const app = express(); // Initialize Express app
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'}); // Create a write stream (in append mode) and create a 'log.txt' file in the root directory. Appended via path.join


let topMovies = [
    {
        title: 'Enter the Dragon (1973)',
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
        title: 'Drunken Master (1978)',
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
        title: 'Crouching Tiger, Hidden Dragon (2000)',
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
        title: 'Ip Man (2008)',
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
        title: 'The 36th Chamber of Shaolin (1978)',
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
        title: 'Kung Fu Hustle (2004)',
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
        title: 'The Way of the Dragon (1972)',
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
        title: 'The Monkey King (2014)',
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
        title: 'Ong Bak: The Thai Warrior (2003)',
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
        title: 'Once Upon a Time in China (1991)',
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

app.use(morgan('combined', {stream: accessLogStream})); // Use morgan middleware to log requests and view logs in log.txt
app.use(express.static('public')); // Automatically serve all static files from "public"-folder

app.get('/', (req, res) => {
    res.send(`Welcome to DojoDB - Let's kick things off!`) // Sends response text for root - endpoint
});
app.get('/movies', (req, res) => {
    res.json(topMovies); // Sends movie list as JSON response for /movies - endpoint
});

app.use((err,req,res,next) => {
    console.error(err.stack); // Logs error
    res.status(500).send('Something went wrong at the dojo. Try again later.') // sends error message
}
)

app.listen(3000, () => { // Start server on port 3000
    console.log('Your server is running on port 3000');
});
