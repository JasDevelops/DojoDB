// Login endpoint for registered users
const passport = require("passport");
require("./passport.js");

// POST login
module.exports = (router) => {
    router.post("/login", (req, res) => {
        passport.authenticate("local", { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({ message: "Something is wrong.", user: user });
            }
            req.login(user, { session: false }, (error) => {
                if (error) { return res.send(error);}
                let token = user.generateJWTToken();
                return res.json({ 
                    message: "Login successful", user: {_id:user._id, username: user.username}, token });
            });
        })(req, res);
    });
};
