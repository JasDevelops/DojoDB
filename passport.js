const passport = require("passport");

LocalStrategy = require("passport-local").Strategy,
Models = require("./models.js"),
passportJWT = require("passport-jwt");

let Users = Models.User,
JWTStrategy = passportJWT.Strategy,
ExtractJWT = passportJWT.ExtractJwt;

// Local Strategy for basic HTTP authentication
passport.use (
    new LocalStrategy(
        {
            usernameField : "username",
            passwordField: "password",
        },
        async (username, password, callback) => {
            console.log(`${username} ${password}`);
            await Users.findOne({username: username})
            .then((user) => {
                if (!user){
                    console.log("wrong username");
                    return callback(null, false, {
                        message: "Wrong username or password.",
                    });
                }
                console.log("finished");
                return callback(null, user);
            })
            .catch((error) => {
                if (error) {
                    console.log(error); return callback(error);
                }
            })
        }
    )
);
// JWT Strategy for authentication
passport.use(new JWTStrategy ({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey:"mySecretJWT"
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
    .then((user) => {
        if (!user) {
            // If user is not found, return an error
            return callback(new Error('User not found'), false);
        }
        // If user is found, pass the user object to callback
        return callback(null, user);
    })
    .catch((err) => {
        // Catch any errors from the database query
        return callback(err, false);
    });
}));
