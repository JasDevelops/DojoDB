const passport = require("passport");

passport = require("passport"),
LocalStrategy = require("passport-local").Strategy,
Models = require("./models.js"),
passportJWT = require("passport-jwt");

let Users = Models.User,
JWTStrategy = passportJWT.Strategy,
ExtractJWT = passportJWT.ExtractJWT;

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
            .catch((err) => {
                if (err) {
                    console.log(err); return callback(err);
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
        return callback(err)
    });
}));