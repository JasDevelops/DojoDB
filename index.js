const express = require('express'); // Import Express
const bcrypt = require('bcrypt'); // Import bcrypt
const { check, param, validationResult } = require('express-validator'); // Import express validator
const app = express(); // Initialize Express app

app.use(express.json()); // Import body parser
app.use(express.urlencoded({ extended: true })); // Import body parser

const cors = require('cors');
const passport = require('passport');
const morgan = require('morgan'); // Import Morgan for logging requests
const fs = require('fs'); // Import built-in modules fs to help to create and append logs
const uuid = require('uuid'); // uuid package to generate unique IDs
const path = require('path'); // Import built-in modules path to help file paths work

const mongoose = require('mongoose'); // Import Mongoose
mongoose.connect(process.env.CONNECTION_URI);

const Models = require('./models.js'); // Import Mongoose-Models
const Movies = Models.Movie; // Movie-Model
const Users = Models.User; // User-Model

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' }); // Create a write stream (in append mode) and create a "log.txt" file in the root directory. Appended via path.join
app.use(morgan('combined', { stream: accessLogStream })); // Use morgan middleware to log requests and view logs in log.txt

const allowedOrigin = [
	'http://localhost:3000',
	'http://localhost:4200',
	'https://dojo-db-e5c2cf5a1b56.herokuapp.com',
	'http://localhost:1234',
	'https://www.dojo-db-e5c2cf5a1b56.herokuapp.com',
	'https://dojodb.netlify.app',
	'https://jasdevelops.github.io',
	'https://jasdevelops.github.io/ShadowKick',
];

app.use(
	cors({
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
	})
);

app.options('*', cors()); // Enable pre-flight for all routes

let auth = require('./auth')(app);
require('./passport');

/**
 * @route GET /search/:searchTerm
 * @summary Search for movies, actors, directors, or genres based on the search term.
 * @param {string} searchTerm - The term to search for in movies, actors, directors, and genres.
 * @returns {Object[]} 200 - An array of matching search results (movies, actors, directors, or genres).
 * @returns {Error} 404 - If no results are found for the search term.
 * @returns {Error} 500 - If an internal server error occurs while searching.
 * @async
 */
app.get(
	'/search/:searchTerm',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Decodes and formats the search term from the URL parameter
		const searchTerm = decodeURIComponent(req.params.searchTerm).trim().toLowerCase();
		try {
			// Creates a regular expression based on the search term to search for matches in different fields
			const regex = new RegExp(searchTerm, 'i');
			// `results` holds the matched movies or documents that meet the regex criteria
			const results = await Movies.find({
				$or: [
					{ title: { $regex: regex } },
					{ 'actors.name': { $regex: regex } },
					{ 'director.name': { $regex: regex } },
					{ 'genre.name': { $regex: regex } },
					...(isNaN(searchTerm) ? [] : [{ releaseYear: parseInt(searchTerm, 10) }]),
				],
			});
			// If no matching results were found, return a 404
			if (results.length === 0) {
				return res.status(404).json({
					message: `No results for the search term "${searchTerm}" found.`,
				});
			}
			// Maps through the results and determines the type of match (movie, actor, director, genre)
			let searchResults = results.map((result) => {
				let type = 'movie';

				// Check if actor name or director name matched
				if (result.actors.some((actor) => actor.name.toLowerCase().includes(searchTerm))) {
					type = 'actor';
				} else if (result.director.name.toLowerCase().includes(searchTerm)) {
					type = 'director';
				} else if (result.genre.name.toLowerCase().includes(searchTerm)) {
					type = 'genre';
				}
				return {
					type,
					title: result.title,
					description: result.description,
					genre: result.genre,
					director: result.director,
					image: result.image,
					releaseYear: result.releaseYear,
					actors: result.actors,
					_id: result._id,
				};
			});
			// Sends back the formatted search results
			res.status(200).json(searchResults);
		} catch (error) {
			console.error('Error in search route:', error);
			console.error('Error in search route:', error.message);
			console.error('Stack trace:', error.stack);
			// Sends back an error message (500)
			res.status(500).json({
				message: 'Something went wrong while searching. Please try again later.',
			});
		}
	}
);
/**
 * @function
 * @description Automatically serves all static files from the "public" folder.
 */
app.use(express.static('public'));

/**
 * @route GET /
 * @description Sends a welcome message when the root endpoint is accessed.
 * @returns {string} A welcome message: "Welcome to DojoDB - Let's kick things off!"
 */
app.get('/', (req, res) => {
	res.send(`Welcome to DojoDB - Let's kick things off!`);
});

/**
 * @route GET /movies
 * @summary Retrieves a list of all movies.
 * @async
 * @returns {Object} 200 - The movie object.
 * @returns {Error} 404 - Movie not found.
 * @returns {Error} 500 - Internal server error.

*/
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find()
		.then((movies) => {
			// Reorders the movies to ensure a consistent response format
			const orderedMovies = movies.map((movie) => ({
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
			// Sends back an error message (500)
			res.status(500).json({
				message: 'Something went wrong while fetching the movies. Please try again later.',
			});
		});
});

/**
 * @route GET /movies/:title
 * @summary Get data about a specific movie by title.
 * @param {string} title - The title of the movie to search for.
 * @returns {Object} 200 - The movie details.
 * @returns {Error} 404 - If no movie is found with the given title.
 * @returns {Error} 500 - If an internal server error occurs.
 * @async
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Decodes and formats the movie title from the URL parameter
	const movieTitle = decodeURIComponent(req.params.title).trim().toLowerCase();
	// Find specific movie (case insensitive)
	await Movies.findOne({ title: { $regex: new RegExp(movieTitle, 'i') } })
		.then((movie) => {
			// If no matching movie title was found, return a 404
			if (!movie) {
				return res.status(404).json({
					message: `No movie with the title "${movieTitle}" found.`,
				});
			}
			// Reorders the movies to ensure a consistent response format
			const orderMovies = {
				title: movie.title,
				description: movie.description,
				genre: movie.genre,
				director: movie.director,
				image: movie.image,
				releaseYear: movie.releaseYear,
				actors: movie.actors,
				_id: movie._id,
			};
			// Returns found movie (ordered)
			res.json(orderMovies);
		})
		.catch((err) => {
			console.error(err);
			// Sends back an error message (500)
			res.status(500).json({
				message: 'Something went wrong while fetching the movie details. Please try again later.',
			});
		});
});

/**
 * @route GET /movies/release-year/:year
 * @summary Get movies released in a specific year.
 * @param {string} year - The release year of the movies to search for.
 * @returns {Object[]} 200 - An array of movies released in the given year.
 * @returns {Error} 404 - If no movies are found for the given year.
 * @returns {Error} 500 - If an internal server error occurs.
 * @async
 */
app.get(
	'/movies/release-year/:year',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Trims the year from URL
		const year = req.params.year.trim();
		await Movies.find({
			// Finds movies by release year
			releaseYear: year,
		})
			.then((movies) => {
				if (movies.length === 0) {
					// If no matching year was found, return a 404
					return res.status(404).json({
						message: `No movie for the release year "${year}" found.`,
					});
				}
				// Reorders movie data for consistent display
				const orderedMovies = movies.map((movie) => ({
					title: movie.title,
					releaseYear: movie.releaseYear,
					description: movie.description,
					genre: movie.genre.name,
					director: movie.director,
					image: movie.image,
					actors: movie.actors,
					_id: movie._id,
				}));
				// Return all movies for that year
				res.status(200).json(orderedMovies);
			})
			.catch((err) => {
				console.error(err);
				// Sends back an error message (500)
				res.status(500).json({
					message:
						'Something went wrong while fetching the movies by release year. Please try again later.',
				});
			});
	}
);

/**
 * @route GET /actors/:name
 * @summary Get data about an actor by name.
 * @param {string} name - The name of the actor to search for.
 * @returns {Object} 200 - The actor's details along with movies and roles.
 * @returns {Error} 404 - If no movies or actor are found.
 * @returns {Error} 500 - If an internal server error occurs.
 * @async
 */
app.get('/actors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Decodes and formats the actor's name from the URL parameter
	const actorName = decodeURIComponent(req.params.name).trim().toLowerCase();
	await Movies.find({ 'actors.name': { $regex: new RegExp(actorName, 'i') } })
		.then((movies) => {
			// If no movie for the actor was found, return a 404
			if (movies.length === 0) {
				return res.status(404).json({
					message: `No movie for the actor with the name "${actorName}" found.`,
				});
			}
			// Extracts actor details and roles from the movies
			const actorDetails = {
				name: actorName,
				roles: movies.flatMap((movie) =>
					movie.actors
						.filter((actor) => actor.name.toLowerCase() === actorName)
						.map((actor) => ({
							title: movie.title,
							actors: movie.actors,
							role: actor.role,
							releaseYear: movie.releaseYear,
							description: movie.description,
							genre: movie.genre.name,
							director: movie.director,
							image: movie.image,
							_id: movie._id,
						}))
				),
			};
			// If no matching actor was found, return a 404
			if (actorDetails.roles.length === 0) {
				return res.status(404).json({
					message: `No actor with the name "${actorName}" found.`,
				});
			}
			// Returns actor details with their roles
			return res.status(200).json(actorDetails);
		})
		.catch((err) => {
			console.error(err);
			// Sends back an error message (500)
			res.status(500).json({
				message: 'Something went wrong while fetching actor data. Please try again later.',
			});
		});
});

/**
 * @route GET /genres/:name
 * @summary Get information about a genre by its name.
 * @param {string} name - The name of the genre to search for.
 * @returns {Object} 200 - Details of the genre with a list of associated movies.
 * @returns {Error} 404 - If no movies are found for the given genre.
 * @returns {Error} 500 - If an internal server error occurs while fetching genre data.
 * @async
 */
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Cleaned-up genre name from URL
	const genreName = decodeURIComponent(req.params.name).trim().toLowerCase();
	await Movies.find({ 'genre.name': { $regex: new RegExp(genreName, 'i') } })
		.then((movies) => {
			// If no movies are found, return a 404 error
			if (movies.length === 0) {
				return res.status(404).json({
					message: `No movie for the genre with the name "${genreName}" found.`,
				});
			}
			// Extract the genre from the first movie in the result
			const genre = movies[0].genre;
			// Prepare data to return: genre info and a list of movies in this genre
			const genreData = {
				name: genre.name,
				description: genre.description,
				movies: movies.map((movie) => ({
					// List movie details
					title: movie.title,
					actors: movie.actors,
					director: movie.director,
					releaseYear: movie.releaseYear,
					description: movie.description,
					genre: movie.genre.name,
					image: movie.image,
					_id: movie._id,
				})),
			};
			// Return genre details and movie list
			return res.status(200).json(genreData);
		})
		.catch((err) => {
			// Log error and send 500 internal server error response
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while fetching genre data. Please try again later.',
			});
		});
});

/**
 * @route GET /directors/:name
 * @summary Get information about a director by their name.
 * @param {string} name - The name of the director to search for.
 * @returns {Object} 200 - Details of the director with a list of movies they directed.
 * @returns {Error} 404 - If no movies are found for the given director.
 * @returns {Error} 500 - If an internal server error occurs while fetching director data.
 * @async
 */

app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Cleaned-up director name from URL
	const directorName = decodeURIComponent(req.params.name).trim().toLowerCase();
	// Find movies with matching director name (case insensitive)
	await Movies.find({ 'director.name': { $regex: new RegExp(directorName, 'i') } })
		.then((movies) => {
			// If no movies for the director are found, return a 404 error
			if (movies.length === 0) {
				return res.status(404).json({
					message: `No movie for the director with the name "${directorName}" found.`,
				});
			}
			// Extract director details from the first movie
			const director = movies[0].director;
			// Prepare director details and associated movies data
			const directorData = {
				name: director.name,
				bio: director.bio,
				birthYear: director.birthYear,
				deathYear: director.deathYear,
				movies: movies.map((movie) => ({
					// List of movies directed by this director
					title: movie.title,
					actors: movie.actors,
					director: movie.director,
					releaseYear: movie.releaseYear,
					description: movie.description,
					genre: movie.genre.name,
					image: movie.image,
					_id: movie._id,
				})),
			};
			// Return director data with the list of directed movies
			res.status(200).json(directorData);
		})
		.catch((err) => {
			// Log error and send 500 internal server error response
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while fetching the director data. Please try again later.',
			});
		});
});

/**
 * @route GET /users/:username
 * @summary Get the profile of a user by their username.
 * @param {string} username - The username of the user whose profile is to be fetched.
 * @returns {Object} 200 - User profile details.
 * @returns {Error} 404 - If no user with the specified username is found.
 * @returns {Error} 500 - If an internal server error occurs while fetching the user profile.
 * @async
 */
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		// Get username from the authenticated user
		const username = req.user.username;
		const user = await Users.findOne({ username });

		// If no user found, return 404 error
		if (!user) {
			return res.status(404).json({
				message: `No user with the username "${username}" found.`,
			});
		}
		// Return user profile information
		res.status(200).json({
			user: {
				username: user.username,
				email: user.email,
				birthday: user.birthday,
				favourites: user.favourites || [],
			},
		});
	} catch (err) {
		// Log error and send 500 internal server error response
		console.error(err);
		res.status(500).json({
			message: 'Something went wrong while fetching your profile. Please try again later.',
		});
	}
});

/**
 * @route POST /users
 * @summary Register a new user with username, email, password, and optional birthday.
 * @param {string} username - The username of the new user.
 * @param {string} email - The email of the new user.
 * @param {string} password - The password of the new user (must be at least 3 characters long).
 * @param {string} [birthday] - The optional birthday of the new user (in YYYY-MM-DD format).
 * @returns {Object} 200 - Confirmation message and user details along with a generated token.
 * @returns {Error} 400 - If required fields are missing or if email or username already exists.
 * @returns {Error} 422 - If validation errors are present in the provided data.
 * @returns {Error} 500 - If an internal server error occurs while creating the user.
 * @async
 */

app.post(
	'/users',
	[
		// Validate user input for registration
		check('username').isLength({ min: 1 }).withMessage('Please provide a username.'),
		check('email')
			.matches(/.+@.+\..+/)
			.isEmail()
			.withMessage('Please provide a valid email.'),
		check('password')
			.isLength({ min: 3 })
			.withMessage('Password must be at least 3 characters long.'),
		check('birthday')
			.optional()
			.isDate()
			.isISO8601()
			.withMessage('Birthday must be a valid date (YYYY-mm-dd).'),
	],
	async (req, res) => {
		const errors = validationResult(req);
		// If validation errors are present, return 422 error with details
		if (!errors.isEmpty()) {
			return res.status(422).json({
				message: 'There were validation errors with the provided data.',
				errors: errors.array(),
			});
		}
		// Get user data from the request body
		const { username, email, password, birthday } = req.body;
		if (!username || !email || !password) {
			// If username, email, or password is missing, return a 400 error
			return res.status(400).json({
				message: 'Please provide username, email, and password.',
			});
		}
		// Check if user already exists by email or username, return 400 error if duplicate
		if (await Users.findOne({ email })) {
			return res.status(400).json({
				message: 'User with this email already exists.',
			});
		}
		if (await Users.findOne({ username })) {
			return res.status(400).json({
				message: 'User with this username already exists.',
			});
		}
		try {
			// Hash password before saving
			const hashedPassword = Users.hashPassword(req.body.password);
			// Create a new user object
			const newUser = new Users({
				username,
				email,
				password: hashedPassword, // Store hashed password
				birthday: birthday || null, // If birthday not provided set it to null
			});
			// Save the new user to the database
			newUser
				.save()
				.then((savedUser) => {
					// Generate a JWT token for the new user
					const token = savedUser.generateJWTToken();
					// Return success message with user details and token
					res.status(200).json({
						message: 'User created successfully.',
						user: {
							_id: savedUser._id,
							username: savedUser.username,
							email: savedUser.email,
							birthday: savedUser.birthday,
						},
						token,
					});
				})
				.catch((err) => {
					// Log error and send 500 internal server error response
					console.error(err);
					res.status(500).json({
						message: 'Something went wrong while creating user. Please try again later.',
					});
				});
		} catch (error) {
			// Log error and send 500 internal server error response
			console.error(error);
			res.status(500).json({
				message: 'Something went wrong while hashing password. Please try again later.',
			});
		}
	}
);

/**
 * @description Update user details by username.
 * @route PUT /users/:username
 * @param {string} username - The username of the user to be updated (in the URL parameter).
 * @body {string} [newUsername] - The new username of the user (optional).
 * @body {string} [newEmail] - The new email address of the user (optional).
 * @body {string} [newPassword] - The new password of the user (optional).
 * @body {string} [newBirthday] - The new birthday of the user in YYYY-MM-DD format (optional).
 * @body {Array} [favourites] - An array of favourite movies to add or remove (optional).
 * @returns {Object} 200 - User updated successfully.
 * @returns {Object} 400 - No new data to update.
 * @returns {Object} 403 - Permission denied to modify another user's account.
 * @returns {Object} 404 - No user found with the provided username.
 * @returns {Object} 422 - Validation failed for one or more fields.
 * @returns {Object} 500 - Error occurred while updating the user.
 */
app.put(
	'/users/:username',
	passport.authenticate('jwt', { session: false }),
	[
		// Validate updated data
		param('username')
			.isAlphanumeric()
			.isLength({ min: 1 })
			.withMessage('Username must be alphanumeric.'),
		check('newUsername')
			.optional()
			.isAlphanumeric()
			.isLength({ min: 1 })
			.withMessage('New username must be alphanumeric.'),
		check('newEmail')
			.optional()
			.matches(/.+@.+\..+/)
			.isEmail()
			.withMessage('New email must be a valid email address.'),
		check('newPassword')
			.optional()
			.isLength({ min: 3 })
			.withMessage('New password must be at least 3 characters long.'),
		check('newBirthday')
			.optional()
			.isISO8601()
			.withMessage('New birthday must be a valid date (YYYY-mm-dd).'),
	],
	async (req, res) => {
		// Validate the request body against the rules
		const errors = validationResult(req);
		// If validation fails, send Error 422
		if (!errors.isEmpty()) {
			return res.status(422).json({
				message: 'Validation failed',
				errors: errors.array(),
			});
		}
		// Extract the 'username' from the URL parameters
		const { username } = req.params;
		// Extract data from the request body for the update
		const { newUsername, newEmail, newPassword, newBirthday, favourites } = req.body;
		// Check if the user is trying to modify their own account
		if (req.user.username !== username) {
			// Send 403 if not their own account
			return res.status(403).json({
				message: 'Permission denied. You can only modify your own account.',
			});
		}
		try {
			// Check if the user exists in the database
			const existingUser = await Users.findOne({ username });
			// If username not in the database, return a 404
			if (!existingUser) {
				return res.status(404).json({
					message: `No user with the username "${username}" found.`,
				});
			}
			// Initialize an object to hold the update data
			const updateData = {};
			// Initialize an array to track which fields have been updated
			const updatedFields = [];

			// Update fields if new values are provided and not equal to the existing ones
			if (newUsername && newUsername !== existingUser.username) {
				updateData.username = newUsername;
				updatedFields.push('username');
			}
			if (newEmail && newEmail !== existingUser.email) {
				updateData.email = newEmail;
				updatedFields.push('email');
			}
			if (newPassword && newPassword !== existingUser.password) {
				// Hash the new password
				const hashedPassword = await Users.hashPassword(newPassword);
				updateData.password = hashedPassword;
				updatedFields.push('password');
			}
			if (newBirthday && newBirthday !== existingUser.birthday) {
				updateData.birthday = newBirthday || null;
				updatedFields.push('birthday');
			}
			if (favourites && favourites.length > 0) {
				// Separate 'add' and 'remove' actions from the favourites array
				const addFavourites = favourites.filter((movie) => movie.action === 'add');
				const removeFavourites = favourites.filter((movie) => movie.action === 'remove');

				// If there are movies to add, update the favourites array
				if (addFavourites.length > 0) {
					const addMovieIds = addFavourites.map((movie) => movie._id);
					updateData.favourites = [...existingUser.favourites, ...addMovieIds];
					updatedFields.push('favourites (added movies)'); // Track the update
				}
				// If there are movies to remove, update the favourites array
				if (removeFavourites.length > 0) {
					// Extract the movie IDs
					const removeMovieIds = removeFavourites.map((movie) => movie._id);
					updateData.favourites = existingUser.favourites.filter(
						(movie) => !removeMovieIds.includes(movie._id)
					);
					updatedFields.push('favourites (removed movies)'); // Track the update
				}
			}
			// If no updates were made, send 400
			if (Object.keys(updateData).length === 0) {
				return res.status(400).json({
					message: 'No new data to update.',
				});
			}
			// Update the user in the database with the new data
			const updatedUser = await Users.findOneAndUpdate(
				{ username },
				{ $set: updateData },
				{ new: true }
			);
			// Respond with a success message
			res.status(200).json({
				message: 'User updated successfully.',
				updatedFields: updatedFields.reduce((acc, field) => {
					acc[field] = `${field} updated successfully`;
					return acc;
				}, {}),
				user: {
					username: updatedUser.username,
					email: updatedUser.email,
					birthday: updatedUser.birthday,
					favourites: updatedUser.favourites || [],
				},
			});
		} catch (err) {
			// Log error and send 500 internal server error response
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while updating user. Please try again later.',
			});
		}
	}
);

/**
 * @description Add a movie to the user's favorites by movie ID.
 * @route PUT /users/:username/favourites/:movieID
 * @param {string} username - The username of the user who wants to add a movie to favorites (in the URL).
 * @param {string} movieID - The ID of the movie to add to the user's favorites (in the URL).
 * @returns {Object} 200 - Successfully added movie to favorites.
 * @returns {Object} 400 - Movie is already in the user's favorites.
 * @returns {Object} 403 - Permission denied to modify another user's favorites.
 * @returns {Object} 404 - Movie or user not found.
 * @returns {Object} 500 - Error occurred while adding the movie.
 */
app.put(
	'/users/:username/favourites/:movieID',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Extract username and movieID from URL parameters
		const { username, movieID } = req.params;

		// Check if the authenticated user matches the username in the URL
		if (req.user.username !== username) {
			return res.status(403).json({
				message: 'Permission denied. You can only modify your own favourites.',
			});
		}

		try {
			// Find the movie by movieID
			const movie = await Movies.findById(movieID);
			if (!movie) {
				// If no movie is found, return 404
				return res.status(404).json({
					message: `No movie with the ID "${movieID}" found.`,
				});
			}
			// Find the user by username
			const user = await Users.findOne({ username });
			if (!user) {
				// If no user is found, return 404
				return res.status(404).json({
					message: `No user with the username "${username}" found.`,
				});
			}
			// Check if the movie is already in the user's favourites
			const movieExistsInFavourites = user.favourites.some((fav) => {
				if (fav.movieId) {
					return fav.movieId.toString() === movie._id.toString();
				}
				return false;
			});
			// If movie is already in favourites, return 400
			if (movieExistsInFavourites) {
				return res.status(400).json({
					message: `Movie with the ID "${movieID}" is already in the favourites list.`,
				});
			}
			// Add the movie to the user's favourites
			user.favourites.push({
				movieId: movie._id,
				title: movie.title,
			});

			// Save the updated user document
			const updatedUser = await user.save();
			// Map the updated favourites to return only the movieId and title
			const updatedFavourites = updatedUser.favourites.map((fav) => ({
				movieId: fav.movieId,
				title: fav.title,
			}));
			// Return success message with updated favourites
			res.status(200).json({
				message: `Movie "${movie.title}" with the ID "${movieID}" added to favourites.`,
				username: updatedUser.username,
				favourites: updatedFavourites,
			});
		} catch (err) {
			// Log error and send 500 internal server error response
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while adding the movie. Please try again later.',
			});
		}
	}
);

/**
 * @description Remove a movie from the user's favorites by movie ID.
 * @route DELETE /users/:username/favourites/:movieID
 * @param {string} username - The username of the user who wants to remove a movie from favorites (in the URL).
 * @param {string} movieID - The ID of the movie to remove from the user's favorites (in the URL).
 * @returns {Object} 200 - Successfully removed movie from favorites.
 * @returns {Object} 403 - Permission denied to modify another user's favorites.
 * @returns {Object} 404 - Movie or user not found.
 * @returns {Object} 500 - Error occurred while removing the movie.
 */
app.delete(
	'/users/:username/favourites/:movieID',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Extract username and movieID from URL parameters
		const { username, movieID } = req.params;

		// Check if the authenticated user matches the username in the URL
		if (req.user.username !== username) {
			return res.status(403).json({
				message: 'Permission denied. You can only modify your own favourites.',
			});
		}
		try {
			// Find the movie by movieID
			const movie = await Movies.findById(movieID);
			if (!movie) {
				// If no movie is found, return 404
				return res.status(404).json({
					message: `No movie with the ID "${movieID}" found.`,
				});
			}

			// Find the user and remove the movie from favourites
			const updatedUser = await Users.findOneAndUpdate(
				{ username },
				{ $pull: { favourites: { movieId: movie._id } } },
				{ new: true }
			);
			if (!updatedUser) {
				// If no user is found, return 404
				return res.status(404).json({
					message: `No user with the username "${username}" found.`,
				});
			}
			// Return the updated list of favourites or a message if none are left
			const updatedFavourites =
				updatedUser.favourites.length > 0
					? updatedUser.favourites.map((fav) => ({
							movieId: fav.movieId,
							title: fav.title,
						}))
					: 'No favourite movies yet';

			// Return success message with updated favourites
			return res.status(200).json({
				message: `Movie with twith the ID "${movieID}" removed from favourites.`,
				username: updatedUser.username,
				favourites: updatedFavourites,
			});
		} catch (err) {
			// Log error and send 500 internal server error response
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while removing the movie. Please try again later.',
			});
		}
	}
);

/**
 * @description Delete a user by username.
 * @route DELETE /users/:username
 * @param {string} username - The username of the user to delete (in the URL).
 * @returns {Object} 200 - Successfully deleted the user.
 * @returns {Object} 403 - Permission denied to delete another user's account.
 * @returns {Object} 404 - User not found.
 * @returns {Object} 500 - Error occurred while deleting the user.
 */
app.delete(
	'/users/:username',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Extract username from URL parameter
		const { username } = req.params;
		if (req.user.username !== username) {
			// Check if the authenticated user matches the username in the URL
			return res.status(403).json({
				message: 'Permission denied. You can only delete your own account.',
			});
		}
		await Users.findOneAndDelete({ username })
			// Delete the user by username
			.then((existingUser) => {
				if (!existingUser) {
					// If no user is found, return 404
					return res.status(404).json({
						message: `No user with the username "${username}" found.`,
					});
				}
				// Return success message for deleted user
				res.status(200).json({
					message: `User with the username "${username}" has been removed.`,
				});
			})
			.catch((err) => {
				// Log error and send 500 internal server error response
				console.error(err);
				res.status(500).json({
					message: 'Something went wrong while deleting user. Please try again later.',
				});
			});
	}
);

// Log errors globally

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something went wrong at the dojo. Try again later.');
});

// Start server on the specified port

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
	console.log(`Server is listening on port ${port}`);
});
