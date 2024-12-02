// Login endpoint for registered users
const jwtSecret = "mySecretJWT"; // Same as in passport.js

const jwt = require("jsonwebtoken"),
    passport = require("passport");

require("./passport.js");

// Function to generate a JWT token
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.username, // Username encoded in the token
        expiresIn: "7d",       // Token expiration time
        algorithm: "HS256"     // Signing algorithm
    });
};

// POST login
module.exports = (router) => {
    router.post("/login", (req, res) => {
        passport.authenticate("local", { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({ message: "Something is wrong.", user: user });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    return res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
};
