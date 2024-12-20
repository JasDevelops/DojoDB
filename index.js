const express = require("express"); // Import Express
const bcrypt = require("bcrypt"); // Import bcrypt
const { check, param, validationResult } = require("express-validator"); // Import express validator
const app = express(); // Initialize Express app

app.use(express.json()); // Import body parser
app.use(express.urlencoded({ extended: true })); // Import body parser

const cors = require("cors");
const passport = require("passport");
const morgan = require("morgan"); // Import Morgan for logging requests
const fs = require("fs"); // Import built-in modules fs to help to create and append logs
const uuid = require("uuid"); // uuid package to generate unique IDs
const path = require("path"); // Import built-in modules path to help file paths work

const mongoose = require("mongoose"); // Import Mongoose
mongoose.connect(process.env.CONNECTION_URI);

const Models = require("./models.js"); // Import Mongoose-Models
const Movies = Models.Movie; // Movie-Model
const Users = Models.User; // User-Model

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" }); // Create a write stream (in append mode) and create a "log.txt" file in the root directory. Appended via path.join
app.use(morgan("combined", { stream: accessLogStream })); // Use morgan middleware to log requests and view logs in log.txt

const allowedOrigin = [
	"http://localhost:3000",
	"https://dojo-db-e5c2cf5a1b56.herokuapp.com",
	"http://localhost:1234",
	"https://www.dojo-db-e5c2cf5a1b56.herokuapp.com"
];

app.use(cors({
	origin: (origin, callback) => {
		if (!origin || allowedOrigin.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
		}
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
}));


app.options('*', cors()); // Enable pre-flight for all routes

let auth = require("./auth")(app);
require("./passport");

app.use(express.static("public")); // Automatically serve all static files from "public"-folder
app.get("/", (req, res) => { res.send(`Welcome to DojoDB - Let's kick things off!`); }); // Sends response text for root - endpoint});


// GET list of all movies

app.get("/movies",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		await Movies.find()
			.then((movies) => {
				const orderedMovies = movies.map((movie) => ({
					// Reorder to display nicely
					title: movie.title,
					description: movie.description,
					genre: movie.genre,
					director: movie.director,
					image: movie.image,
					releaseYear: movie.releaseYear,
					actors: movie.actors,
					_id: movie._id,
				}));
				res.status(200).json(orderedMovies);
			}) // Return all movies (ordered)
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching the movies. Please try again later.",
				});
			}); // Return server error
	});

// GET data about specific movie by title

app.get("/movies/:title",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const movieTitle = decodeURIComponent(req.params.title).trim().toLowerCase();
		await Movies.findOne({ title: { $regex: new RegExp(movieTitle, "i"), } }) // Find specific movie (case insensitive)
			.then((movie) => {
				if (!movie) {
					return res.status(404).json({
						message: `No movie with the title "${movieTitle}" found.`
					}); // Error in case movie not found
				}
				const orderMovies = { // Reorder to display nicely
					title: movie.title,
					description: movie.description,
					genre: movie.genre,
					director: movie.director,
					image: movie.image,
					releaseYear: movie.releaseYear,
					actors: movie.actors,
					_id: movie._id,
				};
				res.json(orderMovies); // Return found movie (ordered)
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching the movie details. Please try again later.",
				});
			});
	});

// GET movies by release year

app.get("/movies/release-year/:year",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const year = req.params.year.trim(); // Cleaned-up year from URL
		await Movies.find({
			releaseYear: year
		}) // Find movies by release year
			.then((movies) => {
				if (movies.length === 0) {
					return res.status(404).json({
						message: `No movie for the release year "${year}" found.`
					});
				}
				const orderedMovies = movies.map((movie) => ({ // Reorder to display nicely
					title: movie.title,
					releaseYear: movie.releaseYear,
					description: movie.description,
					genre: movie.genre.name,
					director: movie.director.name,
					image: movie.image.imageUrl,
					actors: movie.actors,
					_id: movie._id,
				}));
				res.status(200).json(orderedMovies); // Return all movies for that year
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching the movies by release year. Please try again later.",
				});
			});
	});

// GET data about an actor by name

app.get("/actors/:name",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const actorName = decodeURIComponent(req.params.name).trim().toLowerCase(); // Cleaned-up actor name from URL
		await Movies.find({ "actors.name": { $regex: new RegExp(actorName, "i") } })
			.then((movies) => {
				if (movies.length === 0) {
					return res
						.status(404)
						.json({
							message: `No movie for the actor with the name "${actorName}" found.`
						});
				}
				const actorDetails = {
					name: actorName,
					roles: movies.flatMap((movie) =>  // Map and filter all movies
						movie.actors
							.filter((actor) => actor.name.toLowerCase() === actorName)
							.map((actor) => ({
								movieTitle: movie.title,
								role: actor.role,
								_id: movie._id,
							}))
					),
				};
				if (actorDetails.roles.length === 0) {
					return res.status(404).json({
						message: `No actor with the name "${actorName}" found.`
					});
				}
				return res.status(200).json(actorDetails); // Return actor details with the list of movies and roles
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching actor data. Please try again later.",
				});
			});
	});

// GET data about a genre by name

app.get("/genres/:name",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const genreName = decodeURIComponent(req.params.name).trim().toLowerCase(); // Cleaned-up genre name from URL
		await Movies.find({ "genre.name": { $regex: new RegExp(genreName, "i") } })
			.then((movies) => {
				if (movies.length === 0) {
					return res.status(404).json({
						message: `No movie for the genre with the name "${genreName}" found.`
					});
				}
				const genre = movies[0].genre; // Extract the genre from the first movie
				const genreData = {
					name: genre.name,
					description: genre.description,
					movies: movies.map((movie) => ({
						// List of all movies of this genre
						title: movie.title,
						_id: movie._id,
					})),
				};
				return res.status(200).json(genreData); // Return genre details with the list of movies
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching genre data. Please try again later.",
				});
			});
	});

// GET data about a director by name

app.get("/directors/:name",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const directorName = decodeURIComponent(req.params.name).trim().toLowerCase(); // Cleaned-up director name from URL
		await Movies.find({ "director.name": { $regex: new RegExp(directorName, "i") } }) // Find movies with matching director name (case insensitive)
			.then((movies) => {
				if (movies.length === 0) {
					return res.status(404).json({
						message: `No movie for the director with the name "${directorName}" found.`
					});
				}
				const director = movies[0].director; // Extract director from first movie
				const directorData = {
					name: director.name,
					bio: director.bio,
					birthYear: director.birthYear,
					deathYear: director.deathYear,
					movies: movies.map((movie) => ({ // List of movies directed by this director
						title: movie.title,
						releaseYear: movie.releaseYear,
						genre: movie.genre.name,
						_id: movie._id,
					})),
				};
				res.status(200).json(directorData); // Return director details with the list of movies
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while fetching the director data. Please try again later.",
				});
			});
	});

//GET user profile

app.get("/users/:username",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const username = req.user.username;
			const user = await Users.findOne({ username });

			if (!user) {
				return res.status(404).json({
					message: `No user with the username "${username}" found.`
				});
			}
			res.status(200).json({
				user: {
					username: user.username,
					email: user.email,
					birthday: user.birthday,
					favourites: user.favourites || [],
				}
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: "Something went wrong while fetching your profile. Please try again later.",
			});
		}
	});
// POST (register) new user

app.post("/users",
	[
		check("username")
			.isLength({ min: 1 })
			.withMessage("Please provide a username."),
		check("email")
			.matches(/.+@.+\..+/)
			.isEmail()
			.withMessage("Please provide a valid email."),
		check("password")
			.isLength({ min: 3 })
			.withMessage("Password must be at least 3 characters long."),
		check("birthday")
			.optional()
			.isDate()
			.isISO8601().withMessage("Birthday must be a valid date (YYYY-mm-dd)."),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				message: "There were validation errors with the provided data.",
				errors: errors.array()
			});
		}
		const { username, email, password, birthday } = req.body; // Get user data from request body
		if (!username || !email || !password) { // Validation
			return res.status(400).json({
				message: "Please provide username, email, and password."
			});
		}
		if (await Users.findOne({ email })) { // Check if user already exists by email
			return res.status(400).json({
				message: "User with this email already exists."
			});
		}
		if (await Users.findOne({ username })) { // Check if user already exists by username
			return res.status(400).json({
				message: "User with this username already exists."
			});
		}
		try {
			const hashedPassword = Users.hashPassword(req.body.password); // Hash password
			const newUser = new Users({  // Create new user
				username,
				email,
				password: hashedPassword, 	// Store hashed password
				birthday: birthday || null  // If birthday not provided set it to null
			});
			newUser 	// Save new user to database
				.save().then((savedUser) => {
					const token = savedUser.generateJWTToken();

					res.status(200).json({
						message: "User created successfully.",
						user: {
							_id: savedUser._id,
							username: savedUser.username,
							email: savedUser.email,
							birthday: savedUser.birthday,
						},
						token
					});
				})
				.catch((err) => {
					console.error(err);
					res.status(500).json({
						message: "Something went wrong while creating user. Please try again later."
					});
				});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: "Error hashing password. Please try again later."
			});
		}
	});


// UPDATE user by username

app.put("/users/:username",
	passport.authenticate("jwt", { session: false }),
	[ // Validate updated data
		param("username")
			.isAlphanumeric()
			.isLength({ min: 1 })
			.withMessage("Username must be alphanumeric."),
		check("newUsername")
			.optional()
			.isAlphanumeric()
			.isLength({ min: 1 })
			.withMessage("New username must be alphanumeric."),
		check("newEmail")
			.optional()
			.matches(/.+@.+\..+/)
			.isEmail()
			.withMessage("New email must be a valid email address."),
		check("newPassword")
			.optional()
			.isLength({ min: 3 })
			.withMessage("New password must be at least 3 characters long."),
		check("newBirthday")
			.optional()
			.isISO8601()
			.withMessage("New birthday must be a valid date (YYYY-mm-dd)."),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({
				message: "Validation failed",
				errors: errors.array()  // Return detailed error messages
			});
		}

		const { username } = req.params; // Get username from the URL
		const {
			newUsername,
			newEmail,
			newPassword,
			newBirthday,
			favourites
		} = req.body; // Get data from request body

		if (req.user.username !== username) {  // Check if the authenticated user matches the username in the URL
			return res.status(403).json({
				message: "Permission denied. You can only modify your own account."
			});
		}

		// Find the user by their username
		try {
			const existingUser = await Users.findOne({ username })
			if (!existingUser) {
				return res.status(404).json({
					message: `No user with the username "${username}" found.`
				});
			}

			const updateData = {}; // Initialize the update data object
			const updatedFields = []; // Initialize the updatedFields array to track updates

			// Update fields if new values are provided and not equal to the existing ones
			if (newUsername && newUsername !== existingUser.username) {
				updateData.username = newUsername;
				updatedFields.push("username");
			}
			if (newEmail && newEmail !== existingUser.email) {
				updateData.email = newEmail;
				updatedFields.push("email");
			}
			if (newPassword && newPassword !== existingUser.password) {
				const hashedPassword = await Users.hashPassword(newPassword); // Hash the new password
				updateData.password = hashedPassword;
				updatedFields.push("password");
			}
			if (newBirthday && newBirthday !== existingUser.birthday) {
				updateData.birthday = newBirthday || null;
				updatedFields.push("birthday");
			}
			if (favourites && favourites.length > 0) {
				const addFavourites = favourites.filter((movie) => movie.action === 'add');
				const removeFavourites = favourites.filter((movie) => movie.action === 'remove');

				if (addFavourites.length > 0) {
					const addMovieIds = addFavourites.map((movie) => movie._id);  // Extract the movie IDs
					updateData.favourites = [...existingUser.favourites, ...addMovieIds];  // Add the new movies to the existing favourites
					updatedFields.push("favourites (added movies)");  // Track the update
				}

				if (removeFavourites.length > 0) {
					const removeMovieIds = removeFavourites.map((movie) => movie._id);  // Extract the movie IDs
					updateData.favourites = existingUser.favourites.filter((movie) => !removeMovieIds.includes(movie._id));  // Remove the selected movies
					updatedFields.push("favourites (removed movies)");  // Track the update
				}
			}


			if (Object.keys(updateData).length === 0) { // If no fields were updated
				return res.status(400).json({
					message: "No new data to update."
				});
			}
			// Perform the update
			const updatedUser = await Users.findOneAndUpdate({ username }, { $set: updateData }, { new: true });

			// Return the updated user data
			res.status(200).json({
				message: "User updated successfully.",
				updatedFields: updatedFields.reduce((acc, field) => {
					acc[field] = `${field} updated successfully`;
					return acc;
				}, {}),
				user: {
					username: updatedUser.username,
					email: updatedUser.email,
					birthday: updatedUser.birthday,
					favourites: updatedUser.favourites || [],
				}
			});

		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: "Something went wrong while updating user. Please try again later."
			});
		}
	});

/// PUT (add) movie to favorites by title by movieID

app.put("/users/:username/favourites/:movieID",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { username, movieID } = req.params; // MovieID and Username from URL

		if (req.user.username !== username) {  // Check if the authenticated user matches the username in the URL
			return res.status(403).json({
				message: "Permission denied. You can only modify your own favourites."
			});
		}

		try {
			const movie = await Movies.findById(movieID); 	// Find the movie by movieID
			if (!movie) {
				return res.status(404).json({
					message: `No movie with the ID "${movieID}" found.`
				});
			}
			const user = await Users.findOne({ username }); // Find the user by username
			if (!user) {
				return res.status(404).json({
					message: `No user with the username "${username}" found.`
				});
			}
			const movieExistsInFavourites = user.favourites.some((fav) => { // Check if the movie is already in the user"s favourites
				if (fav.movieId) {  // Check if movieId exists
					return fav.movieId.toString() === movie._id.toString();
				}
				return false;  // If movieId is undefined, skip comparison
			});

			if (movieExistsInFavourites) {
				return res.status(400).json({
					message: `Movie with the ID "${movieID}" is already in the favourites list.`
				});
			}
			user.favourites.push({ // Add the movie to favourites
				movieId: movie._id,
				title: movie.title
			});
			const updatedUser = await user.save(); // Save updated user document

			const updatedFavourites = updatedUser.favourites.map((fav) => ({ // Send updated favourites list
				movieId: fav.movieId,
				title: fav.title,
			}));
			res.status(200).json({
				message: `Movie "${movie.title}" with the ID "${movieID}" added to favourites.`,
				username: updatedUser.username,
				favourites: updatedFavourites,
			});
		} catch (err) {
			console.error(err);
			res.status(500).json({
				message: "Something went wrong while adding the movie. Please try again later."
			});
		}
	});

// DELETE a movie from the user's favourites by movieID

app.delete("/users/:username/favourites/:movieID",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { username, movieID } = req.params; // Username and movieID from URL

		if (req.user.username !== username) {  // Check if the authenticated user matches the username in the URL
			return res.status(403).json({
				message: "Permission denied. You can only modify your own favourites."
			});
		}
		try {
			const movie = await Movies.findById(movieID);  // Find the movie by movieID
			if (!movie) {
				return res.status(404).json({
					message: `No movie with the ID "${movieID}" found.`
				});
			}
			const updatedUser = await Users.findOneAndUpdate( // Find the user by username and remove the favorite
				{ username },
				{ $pull: { favourites: { movieId: movie._id } } },
				{ new: true }
			);
			if (!updatedUser) {
				return res.status(404).json({
					message: `No user with the username "${username}" found.`
				});
			}
			const updatedFavourites =
				updatedUser.favourites.length > 0 ?
					updatedUser.favourites.map((fav) => ({
						movieId: fav.movieId,
						title: fav.title,
					})) : "No favourite movies yet";
			return res.status(200).json({
				message: `Movie with twith the ID "${movieID}" removed from favourites.`,
				username: updatedUser.username,
				favourites: updatedFavourites,
			});
		} catch (err) {
			console.error(err);
			res
				.status(500)
				.json({
					message: "Something went wrong while removing the movie. Please try again later."
				});
		}
	});

// DELETE a user by username

app.delete("/users/:username",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { username } = req.params; // Get the username from the URL
		if (req.user.username !== username) {  // Check if the authenticated user matches the username in the URL
			return res.status(403).json({
				message: "Permission denied. You can only delete your own account."
			});
		}
		await Users.findOneAndDelete({ username })
			.then((existingUser) => {
				if (!existingUser) {
					return res.status(404).json({
						message: `No user with the username "${username}" found.`, // User not found
					});
				}
				res.status(200).json({
					message: `User with the username "${username}" has been removed.`, // Success response
				});
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({
					message: "Something went wrong while deleting user. Please try again later.", // Error response
				});
			});
	});

// Log errors

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something went wrong at the dojo. Try again later."); // Send error message
});

// Start server 

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
	console.log(`Server is listening on port ${port}`);
});

