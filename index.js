const express = require("express");     // Import Express
const app = express();     // Initialize Express app
app.use(express.json()); // Import body parser   
app.use(express.urlencoded({extended:true}));   // Import body parser
const morgan = require("morgan");     // Import Morgan for logging requests
const fs = require("fs");     // Import built-in modules fs to help to create and append logs
const uuid = require("uuid");    // uuid package to generate unique IDs
const path = require("path");     // Import built-in modules path to help file paths work
const mongoose = require("mongoose");   // Import Mongoose
mongoose.connect("mongodb://localhost:27017/db",{ useNewUrlParser: true, useUnifiedTopology: true });
const Models = require("./models.js");  // Import Mongoose-Models
const Movies = Models.Movie;    // Movie-Model
const Users = Models.User;  // User-Model

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {flags: "a"});     // Create a write stream (in append mode) and create a "log.txt" file in the root directory. Appended via path.join

app.use(morgan("combined", {stream: accessLogStream}));     // Use morgan middleware to log requests and view logs in log.txt
app.use(express.static("public"));     // Automatically serve all static files from "public"-folder

app.get("/", (req, res) => {
    res.send(`Welcome to DojoDB - Let's kick things off!`)     // Sends response text for root - endpoint
});

// GET list of all movies
app.get("/movies", async(req, res) => {     
    await Movies.find()
    .then((movies) => {
        const orderMovies = movies.map(movie => ({      // Reorder to display nicely
            _id: movie._id,
            title: movie.title,
            description: movie.description,
            genre: movie.genre,
            director: movie.director,
            image: movie.image,
            releaseYear: movie.releaseYear,
            actors: movie.actors
        }));
        res.status(201).json(orderMovies);
    })      // Return all movies (ordered)
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the movies. Please try again later."});
    });     // Return server error
});

// GET data about specific movie by title
app.get("/movies/:title", async(req, res) => {     
    const movieTitle = req.params.title.trim().toLowerCase();     // Clean up title from URL

    await Movies.findOne({title: { $regex: new RegExp("^" + movieTitle + "$", "i") }})        // Find specific movie (case insensitive)
    .then ((movie) => {
        if(!movie) {
            return res.status(404).json({ message: `Movie with the title "${movieTitle}" not found.` });    // Error in case movie not found
        }
        const orderMovies = {      // Reorder to display nicely
            _id: movie._id,
            title: movie.title,
            description: movie.description,
            genre: movie.genre,
            director: movie.director,
            image: movie.image,
            releaseYear: movie.releaseYear,
            actors: movie.actors
        };
        res.json(orderMovies);    // Return found movie (ordered)
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the movie details. Please try again later."});
    });
});

// Get data about a genre by name
app.get("/movies/genres/:genre", (req, res) => {    
    const genre = req.params.genre.trim().toLowerCase();     // Get cleaned-up genre from URL
    const genreDetails = genres.find(g => g.name.trim().toLowerCase() === genre);    // Find genre that matches
    if(genreDetails) {
        res.json(genreDetails);   // Return genre details
    } else {
        res.status(404).send(`Genre "${genre}" not found.`);   // Error message if no genre is found
    }
});

// Get data about a director by name
app.get("/movies/directors/:director", (req, res) => {     
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
app.post("/users", (req, res) => {     
    const newUser = req.body;
    if (!newUser.name || !newUser.email) {    // Check if "name" is provided in request body
        return res.status(400).send("Missing 'name' or 'email'.");   
    }
    const existingUser = users.find(u => u.email === newUser.email || u.name === newUser.name);
    if (existingUser) {     // Check if user with same name or email already exists
        return res.status(400).send(`User with this ${existingUser.email === newUser.email ? "email" : "name"} already exists.`);
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
app.put("/users/:id", (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const updatedUser = req.body;     // Get updated user data
    const user = users.find(u => u.id === userId);  // Find user by ID
    if (!user){
        res.status(404).send(`User with ID "${userId}" not found.`);   // Error message not found
    }
        user.username = updatedUser.username || user.username;  // If username is provided, update it. If not, keep current
        res.status(200).send( {
            message:`User with ID "${userId}" updated successfully.` , username: `${updatedUser.username}`,
            user: user  // Return the updated user object
        }); 
});

// Add movie to user"s favourites list
app.post("/users/:id/favourites/:movieTitle", (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const movieTitle = req.params.movieTitle.trim().toLowerCase();     // Get movie title
    if (!movieTitle) {
        return res.status(400).send("Movie title is required.");
    }
    const user = users.find(u => u.id === userId);      // Find user by ID
    if (!user) {
        return res.status(404).send("User not found.");
    }
    const movie = topMovies.find(m => m.title.trim().toLowerCase() === movieTitle);     // Find movie by title
    if (!movie) {
        return res.status(404).send("Movie not found.");
    }
    if (!user.favourites) {
            user.favourites = [];   // Initialize favourites list (if it doesn"t exist)
    }
    const movieExists = user.favourites.some(fav => fav.title.toLowerCase() === movie.title.toLowerCase());  // Check if movie is already in list
    if (movieExists) {
        return res.send(`${movie.title} is already in favourites.`);   // Message if already added
        } 
        user.favourites.push(movie);    // Adds movie to list
        res.status(201).send(`${movie.title} added to favourites.`);    // Send success message
});

// Remove movie from user"s favourites list
app.delete("/users/:id/favourites/:movieTitle", (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const movieTitle = req.params.movieTitle.trim().toLowerCase();     // Get movie title
    const user = users.find(u => u.id === userId);      // Find user by ID
    if (user) {
        if (!user.favourites) {
            user.favourites = [];   // Initialize favourites list (if it doesn"t exist)
        }
        const movieList = user.favourites.filter(fav => fav.title.toLowerCase() !== movieTitle.toLowerCase());    
        if (movieList.length === user.favourites.length) {
            res.status(404).send("Movie not found in favourites.");   // Error message if not in list (no changes made)   
        } else {
            user.favourites = movieList;
            res.send(`${movieTitle} has been removed from favourites.`);    // Send success message
        }
    } else {
        res.status(404).send("User not found.");
    }
});

// Remove user
app.delete("/users/:id", (req, res) => {     
    const userId = req.params.id;     // Get user ID from URL
    const updatedUsers = users.filter(u => u.id !== userId);
    if(updatedUsers.length === users.length) {
        res.status(404).send("No user was removed.");   // No change was made
    } else {
        users = updatedUsers;   // Update array removing User
    res.send(`User with ID: ${userId} successfully removed.`);     // Send success message
    }
});

// Log errors
app.use((err,req,res,next) => {
    console.error(err.stack);     
    res.status(500).send("Something went wrong at the dojo. Try again later.")     // Send error message
}
);
// Start server on port 3000
app.listen(3000, () => {     
    console.log("Your server is running on port 3000");
});
