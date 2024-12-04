const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const jwtSecret = "mySecretJWT"; // Same as in passport.js

// Movies schema
let movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  image: {
    imageUrl: { type: String },
    imageAttribution: { type: String },
  },
  featured: { type: Boolean, default: false },
  director: {
    name: { type: String },
    bio: { type: String },
    birthYear: { type: Number },
    deathYear: { type: Number, default: null },
  },
  releaseYear: { type: Number },
  actors: [
    {
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
  ],
});

// Users schema
let userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: { type: Date, default: null },
  favourites: [
    {
      movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }, // ObjectId reference to the movie
      title: { type: String } // Title of the movie (for user-friendly display)
    },
  ],
});

// JWT generation method 
userSchema.methods.generateJWTToken = function () {
  return jwt.sign (
    { id: this._id},
    jwtSecret, 
    { 
      subject: this.username, 
      expiresIn: '7d', 
      algorithm: 'HS256'
    }
   );
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
