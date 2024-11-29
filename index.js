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
            title: movie.title,
            description: movie.description,
            genre: movie.genre,
            director: movie.director,
            image: movie.image,
            releaseYear: movie.releaseYear,
            actors: movie.actors,
            _id: movie._id
        }));
        res.status(200).json(orderMovies);
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
            title: movie.title,
            description: movie.description,
            genre: movie.genre.name,
            director: movie.director.name,
            image: movie.image,
            releaseYear: movie.releaseYear,
            actors: movie.actors,
            _id: movie._id
        };
        res.status(200).json(orderMovies);    // Return found movie (ordered)
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the movie details. Please try again later."});
    });
});

// GET all movies from a genre
app.get("/movies/genres/:genre", async(req, res) => {    
    const genre = req.params.genre.trim().toLowerCase();     // Get cleaned-up genre from URL

    await Movies.find({"genre.name": {$regex: new RegExp("^" + genre + "$", "i")}})    // Find movies with the genre (case insensitive)
    .then ((movies) => {
        if(movies.length === 0) {
            return res.status(404).json({ message: `No movies found for "${genre}" genre.`});
        }
        const orderMovies = movies.map(movie => ({      // Reorder to display nicely
            genre: movie.genre,
            title: movie.title,
            description: movie.description,
            director: movie.director.name,
            image: movie.image,
            releaseYear: movie.releaseYear,
            actors: movie.actors,
            _id: movie._id
        }));
        res.status(200).json(orderMovies);  // Return all movies for that genre (ordered)
    })      
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the movies by genre. Please try again later."});
    });
});

// GET movies by release year
app.get("/movies/release-year/:year", async (req, res) => {
    const year = req.params.year.trim(); // Cleaned-up year from URL

    await Movies.find({ releaseYear: year })  // Find movies by release year
    .then((movies) => {
        if (movies.length === 0) {
            return res.status(404).json({ message: `No movies found for the release year "${year}".` });
        }

        const orderedMovies = movies.map(movie => ({  // Reorder to display nicely
            title: movie.title,
            releaseYear: movie.releaseYear,
            description: movie.description,
            genre: movie.genre.name,  
            director: movie.director.name, 
            image: movie.image.imageUrl,  
            actors: movie.actors,
            _id: movie._id
        }));
        res.status(200).json(orderedMovies);  // Return all movies for that year
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the movies by release year. Please try again later." });
    });
});

// GET data about a director by name
app.get("/directors/:name", async (req, res) => {
    const directorName = req.params.name.trim().toLowerCase(); // Cleaned-up director name from URL

    await Movies.find({ "director.name": { $regex: new RegExp(directorName, "i") } })  // Find movies with matching director name (case insensitive)
    .then((movies) => {
        if (movies.length === 0) {
            return res.status(404).json({ message: `No movies found for director "${directorName}".` });
        }
        const director = movies[0].director;  // Assume first movie's director as the reference
        const directorData = {
            name: director.name,
            bio: director.bio,
            birthYear: director.birthYear,
            deathYear: director.deathYear,
            movies: movies.map(movie => ({  // List of movies directed by this director
                title: movie.title,
                releaseYear: movie.releaseYear,
                genre: movie.genre.name,
                _id: movie._id
            }))
        };
        res.status(200).json(directorData);  // Return director details with the list of movies
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "Something went wrong while fetching the director data. Please try again later." });
    });
});


// Add new user
app.post("/users", async (req, res) => {     
    const { username, email, password } = req.body;   // Get user data from request body
    if (!username || !email || !password) {      // Validation   
        return res.status(400).json({ message: "Please provide username, email, and password." });
    }
    if (await Users.findOne({ email })) {   // Check if user already exists by email
        return res.status(400).json({ message: "User with this email already exists." });
    }
    if (await Users.findOne({ username })) {        // Check if user already exists by username
        return res.status(400).json({ message: "User with this username already exists." });
    }
    const newUser = new Users({ username, email, password });           // Create new user
    await newUser.save()        // Save user
        .then(() => {
            res.status(201).json({ message: "User created successfully", user: newUser });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "Failed to create user. Please try again later." });
        });
});

// Update user info by username
app.put("/users/:username", async (req, res) => {
    const { username } = req.params;  // Get the username from the URL
    const { newUsername, newEmail, newPassword, newBirthday, newFavourites } = req.body;  // Get data from request body
    const existingUser = await Users.findOne({ username });     // Check if the user exists
    if (!existingUser) {
        return res.status(404).json({ message: "User not found." });
    }
    if (newUsername && newUsername !== username && await Users.findOne({ username: newUsername })) {        // Check if new username is taken
        return res.status(400).json({ message: "Username is already taken." });
    }
    if (newEmail && newEmail !== existingUser.email && await Users.findOne({ email: newEmail })) {      // Check if new email is taken
        return res.status(400).json({ message: "Email is already taken." });
    }
    const updatedUser = await Users.findOneAndUpdate(       // Update user data
        { username },  // Find the user by the old username
        {
            $set: {
                username: newUsername || username,
                email: newEmail || existingUser.email,
                password: newPassword || existingUser.password,
                birthday: newBirthday || existingUser.birthday,
                favourites: newFavourites || existingUser.favourites,
            }
        },
        { new: true }  // Return the updated user document
    );
    const isModified = updatedUser.username !== username || updatedUser.email !== existingUser.email || updatedUser.password !== existingUser.password || updatedUser.birthday !== existingUser.birthday || updatedUser.favourites !== existingUser.favourites;
    if (!isModified) {      // If no updates were made, return a 400 error
        return res.status(400).json({ message: "No changes were made to the user." });
    }
    res.status(200).json({ message: "User updated successfully.", user: updatedUser });     // Respond with the updated user
});

// Add movie to favourites
app.put("/users/:username/favourites", async (req, res) => {
    const { username } = req.params;  // Get the username from the URL
    const { movieTitel } = req.body;  // Get movie title from request body

    if (!movieTitel) {
        return res.status(400).json({ message: "Please provide a movie name." });  // Validation
    }
    const existingUser = await Users.findOne({ username });         // Check if the user exists
    if (!existingUser) {
        return res.status(404).json({ message: "User not found." });  // User not found
    }
    if (existingUser.favourites.includes(movieTitel)) {        // Check if the movie is already in the user's favourites
        return res.status(400).json({ message: `"${movieTitle}" is already in the favourites list.` });
    }
    existingUser.favourites.push(movieTitel);      // Add the movie to the favourites
    const updatedUser = await existingUser.save();          // Save the updated user document
    if (!updatedUser) {
        return res.status(500).json({ message: "Failed to add movie to favourites. Please try again later." });
    }
    res.status(200).json({ message: `"${movieTitle}" added to favourites successfully.`, user: updatedUser });        // Success response
});



// Remove movie by title from favourites
app.delete("/users/:username/favourites", async (req, res) => {
    const { username } = req.params;  // Get the username from the URL
    const { movieTitle } = req.body;  // Get movie title from request body

    if (!movieTitle) {
        return res.status(400).json({ message: "Please provide a movie title." });  // Validation
    }
    const existingUser = await Users.findOne({ username });         // Check if the user exists
    if (!existingUser) {
        return res.status(404).json({ message: "User not found." });  // User not found
    }
    if (!existingUser.favourites.includes(movieTitle)) {            // Check if the movie is in the user's favourites
        return res.status(400).json({ message: "Movie not found in favourites." });  // Movie not in favourites
    }
    existingUser.favourites.pull(movieTitle);       // Remove the movie from the favourites
    const updatedUser = await existingUser.save();      // Save the updated user document
    if (!updatedUser) {
        return res.status(500).json({ message: "Failed to remove movie from favourites. Please try again later." });
    }
    res.status(200).json({ message: `"${movieTitle}" has been removed from favourites successfully.`, user: updatedUser });        // Success response
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

// undefefined routes
app.use((req, res) => {
    res.status(404).send("Route not found!");
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
