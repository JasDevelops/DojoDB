const mongoose = require("mongoose");

// Movies schema
let movieSchema = mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    genre: {
        name: {type: String},
        description: {type: String}
    },
    image: {
        imageUrl:{type: String},
        imageAttribution: {type: String}
    },
    featured:{type: Boolean, default: false},
    director: {
        name: {type: String},
        bio: {type: String},
        birthYear: {type: Number},
        deathYear: {type: Number, default: null}
    },
    releaseYear: {type: Number},
    actors:[
        {
            name: {type: String},
            role: {type: String}
        }
    ]
});

// Users schema
let userSchema = mongoose.Schema ({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    birthday: {type: Date},
    favourites: [{type: mongoose.Schema.Types.ObjectId, ref: "Movie"}]
});

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;