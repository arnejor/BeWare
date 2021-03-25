const express = require("express");
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const { nextTick } = require("process");
const ExpressError = require("../utils/ExpressError"); 
const { isLoggedIn } = require("../middleware");
const flash = require("connect-flash");


// Lets the user enter the registration-site
router.get("/register", (req, res)=>{
    res.render("users/register")
});

router.post("/register", catchAsync(async (req, res, next)=>{
    try {
        const { email, username, password, groups } = req.body;
        const user = new User({ email, username, groups });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err =>{
            if (err) return next(err);
            req.flash("success", "Welcome!");
            res.redirect("/notifications");
        })
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("register"); 
    } 
}));


// Login render
router.get("/login", (req, res) => {
    res.render("users/login");
});


// Login
router.post("/login", passport.authenticate("local", { failureFlash: true, failureRedirect: "/login"}), (req, res) =>{
    req.flash("success", "Welcome back");
    const redirectUrl = req.session.returnTo || "/notifications";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});




// Logout
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "goodbye!");
    res.redirect("/notifications");
})

module.exports = router;
