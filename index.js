const express = require('express'); // Import Express
const app = express(); // Initialize Express app
app.use(express.json()); // Import body parser
app.use(express.urlencoded({
	extended: true
})); // Import body parser
const morgan = require('morgan'); // Import Morgan for logging requests
const fs = require('fs'); // Import built-in modules fs to help to create and append logs
const uuid = require('uuid'); // uuid package to generate unique IDs
const path = require('path'); // Import built-in modules path to help file paths work
const mongoose = require('mongoose'); // Import Mongoose
mongoose.connect('mongodb://localhost:27017/db');
const Models = require('./models.js'); // Import Mongoose-Models
const Movies = Models.Movie; // Movie-Model
const Users = Models.User; // User-Model
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a'
}); // Create a write stream (in append mode) and create a "log.txt" file in the root directory. Appended via path.join
app.use(morgan('combined', {
	stream: accessLogStream
})); // Use morgan middleware to log requests and view logs in log.txt
app.use(express.static('public')); // Automatically serve all static files from "public"-folder
app.get('/', (req, res) => {
	res.send(`Welcome to DojoDB - Let's kick things off!`);
}); // Sends response text for root - endpoint});

// GET list of all movies

app.get('/movies', async (req, res) => {
	await Movies.find()
		.then((movies) => {
			const orderMovies = movies.map((movie) => ({
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
			res.status(200).json(orderMovies);
		}) // Return all movies (ordered)
		.catch((err) => {
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while fetching the movies. Please try again later.',
			});
		}); // Return server error
});

// GET data about specific movie by title

app.get('/movies/:title', async (req, res) => {
	const movieTitle = req.params.title.trim().toLowerCase(); // Clean up title from URL
	await Movies.findOne({
			title: {
				$regex: new RegExp('^' + movieTitle + '$', 'i')
			}
		}) // Find specific movie (case insensitive)
		.then((movie) => {
			if (!movie) {
				return res.status(404).json({
					message: `No movie with the title "${movieTitle}" found.`
				}); // Error in case movie not found
			}
			const orderMovies = {
				// Reorder to display nicely
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
				message: 'Something went wrong while fetching the movie details. Please try again later.',
			});
		});
});

// GET movies by release year

app.get('/movies/release-year/:year', async (req, res) => {
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
			const orderedMovies = movies.map((movie) => ({
				// Reorder to display nicely
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
				message: 'Something went wrong while fetching the movies by release year. Please try again later.',
			});
		});
});

// GET data about an actor by name

app.get('/actors/:name', async (req, res) => {
	const actorName = req.params.name.trim().toLowerCase(); // Cleaned-up actor name from URL
	await Movies.find({
			'actors.name': {
				$regex: new RegExp(actorName, 'i')
			}
		})
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
				roles: movies.flatMap(
					(
						movie // Map and filter all movies
					) =>
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
				message: 'Something went wrong while fetching actor data. Please try again later.',
			});
		});
});

// GET data about a genre by name

app.get('/genres/:name', async (req, res) => {
	const genreName = req.params.name.trim().toLowerCase(); // Cleaned-up genre name from URL
	await Movies.find({
			'genre.name': {
				$regex: new RegExp(genreName, 'i')
			}
		})
		.then((movies) => {
			if (movies.length === 0) {
				return res
					.status(404)
					.json({
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
				message: 'Something went wrong while fetching genre data. Please try again later.',
			});
		});
});

// GET data about a director by name

app.get('/directors/:name', async (req, res) => {
	const directorName = req.params.name.trim().toLowerCase(); // Cleaned-up director name from URL
	await Movies.find({
			'director.name': {
				$regex: new RegExp(directorName, 'i')
			}
		}) // Find movies with matching director name (case insensitive)
		.then((movies) => {
			if (movies.length === 0) {
				return res
					.status(404)
					.json({
						message: `No movie for the director with the name "${directorName}" found.`
					});
			}
			const director = movies[0].director; // Extract director from first movie
			const directorData = {
				name: director.name,
				bio: director.bio,
				birthYear: director.birthYear,
				deathYear: director.deathYear,
				movies: movies.map((movie) => ({
					// List of movies directed by this director
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
				message: 'Something went wrong while fetching the director data. Please try again later.',
			});
		});
});

// PUT (add) new user

app.post('/users', async (req, res) => {
	const {
		username,
		email,
		password,
		birthday
	} = req.body; // Get user data from request body
	if (!username || !email || !password) {
		// Validation
		return res.status(400).json({
			message: 'Please provide username, email, and password.'
		});
	}
	if (await Users.findOne({
			email
		})) {
		// Check if user already exists by email
		return res.status(400).json({
			message: 'User with this email already exists.'
		});
	}
	if (await Users.findOne({
			username
		})) {
		// Check if user already exists by username
		return res.status(400).json({
			message: 'User with this username already exists.'
		});
	}
	const newUser = new Users({
		username,
		email,
		password,
		birthday: birthday || null
	}); // Create new user, if birthday not provided set it to null
	newUser
		.save()
		.then((savedUser) => {
			res.status(201).json({
				message: 'User created',
				user: savedUser
			});
		})
		.catch((err) => {
			console.error(err);
			res
				.status(500)
				.json({
					message: 'Something went wrong while creating user. Please try again later.'
				});
		});
});


// UPDATE user by username

app.put('/users/:username', (req, res) => {
	const {
		username
	} = req.params; // Get username from the URL
	const {
		newUsername,
		newEmail,
		newPassword,
		newBirthday
	} = req.body; // Get data from request body

	// Find the user by their username
	Users.findOne({
			username
		})
		.then((existingUser) => {
			if (!existingUser) {
				return res.status(404).json({
					message: 'No user found.'
				});
			}

			const updateData = {}; // Initialize the update data object

			// Update fields if new values are provided and not equal to the existing ones
			if (newUsername && newUsername !== existingUser.username) {
				updateData.username = newUsername;
			}
			if (newEmail && newEmail !== existingUser.email) {
				updateData.email = newEmail;
			}
			if (newPassword && newPassword !== existingUser.password) {
				updateData.password = newPassword;
			}
			if (newBirthday && newBirthday !== existingUser.birthday) {
				updateData.birthday = newBirthday;
			}

			if (Object.keys(updateData).length === 0) {
				// If no fields were updated, return an error
				return res.status(400).json({
					message: 'No new data to update.'
				});
			}

			// Perform the update
			Users.findOneAndUpdate({
					username
				}, {
					$set: updateData
				}, {
					new: true
				})
				.then((updatedUser) => {
					res.status(200).json({
						message: 'User updated.',
						user: updatedUser
					});
				})
				.catch((err) => {
					console.error(err);
					res.status(500).json({
						message: 'Something went wrong while updating user. Please try again later.'
					});
				});
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({
				message: 'Something went wrong while trying to find the user. Please try again later.',
			});
		});
});

/// PUT (add) movie to favorites by title

app.put('/users/:username/favourites', async (req, res) => {
	const {
		username
	} = req.params; // Username from URL
	const {
		title
	} = req.body; // Movie title from the request body
	if (!title) {
		return res.status(400).json({
			message: 'Please provide a movie title.'
		});
	}
	try {
		// Find the movie by title (case-insensitive)
		const movie = await Movies.findOne({
			title: {
				$regex: new RegExp('^' + title + '$', 'i')
			}
		});
		if (!movie) {
			return res.status(404).json({
				message: `No movie with the title "${title}" found.`
			});
		}
		// Find the user by username
		const user = await Users.findOne({
			username
		});
		if (!user) {
			return res.status(404).json({
				message: `No user with the username "${username}" found.`
			});
		}
		// Check if the movie is already in the user's favourites
		const movieExistsInFavourites = user.favourites.some(
			(fav) => fav.movieId.toString() === movie._id.toString() // Compare ObjectIds to avoid redundancy
		);
		if (movieExistsInFavourites) {
			return res
				.status(400)
				.json({
					message: `Movie with the title "${title}" is already in the favourites list.`
				});
		}
		// Add the movie to favourites
		user.favourites.push({
			movieId: movie._id,
			title: movie.title
		});
		// Save the updated user document
		const updatedUser = await user.save();
		const updatedFavourites = updatedUser.favourites.map((fav) => ({
			movieId: fav.movieId,
			title: fav.title,
		}));
		res.status(200).json({
			message: `Movie with the title "${title}" added to favourites.`,
			username: updatedUser.username,
			favourites: updatedFavourites,
		});
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.json({
				message: 'Something went wrong while adding the movie. Please try again later.'
			});
	}
});

// DELETE a movie from the user's favourites

app.delete('/users/:username/favourites', async (req, res) => {
	const {
		username
	} = req.params; // Username from URL
	const {
		title
	} = req.body; // Movie title from the request body
	if (!title) {
		return res.status(400).json({
			message: 'Please provide a movie title.'
		});
	}
	try {
		// Find the movie by title (case-insensitive)
		const movie = await Movies.findOne({
			title: {
				$regex: new RegExp('^' + title + '$', 'i')
			},
		});
		if (!movie) {
			return res.status(404).json({
				message: `No movie with the title "${title}" found.`
			});
		}
		// Find the user by username and remove the favorite in one step
		const updatedUser = await Users.findOneAndUpdate({
				username
			}, // Find the user
			{
				$pull: {
					favourites: {
						movieId: movie._id
					}
				}
			}, // Remove from favourites
			{
				new: true
			} // Return the updated document
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
			})) :
			'No favourite movies yet';
		return res.status(200).json({
			message: `Movie with the title "${title}" removed from favourites.`,
			username: updatedUser.username,
			favourites: updatedFavourites,
		});
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.json({
				message: 'Something went wrong while removing the movie. Please try again later.'
			});
	}
});

// DELETE a user by username

app.delete('/users/:username', async (req, res) => {
	const {
		username
	} = req.params; // Get the username from the URL
	await Users.findOneAndDelete({
			username
		}) // Use an object with { username } as the filter
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
				message: 'Something went wrong while deleting user. Please try again later.', // Error response
			});
		});
});

// Undefefined routes

app.use((req, res) => {
	res.status(404).send('No route found.');
});

// Log errors

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something went wrong at the dojo. Try again later.'); // Send error message
});

// Start server on port 3000

app.listen(3000, () => {
	console.log('Your server is running on port 3000');
});