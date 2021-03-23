
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const catchAsync = require("./utils/catchAsync");
const Group = require("./models/groups");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const publicVapidKey ='BJPpZiL70hlUB8gbxv1QgSJufk1YNH1-urBSHxgHQvQ_fynJX4VBszIjwTAEsNxSe0H8vUPoIrDPCqFq8fo-VGA';
const privateVapidKey = 'jVSQa1wFlhWux7qA1kicCpv8MOe-VEU2jQXNMXEwOxw';
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
// FIX THIS TO THE .env FILE
const geocoder = mbxGeocoding({ accessToken: "pk.eyJ1IjoiYXJuZWpvciIsImEiOiJja2xrZ3RjaXgwNGxsMndtd2c1dGdiOWhzIn0.yx2qojumUfuRN-4AX2Cxow" });

// Here we require the routes for notifications and users. 
const notifications = require("./routes/notifications");
const groupRoutes = require("./routes/groups");
const usersRoutes = require("./routes/users");
const { isLoggedIn } = require("./middleware");
const user = require("./models/user");


// Connecting app to database
mongoose.connect("mongodb://localhost:27017/cloud-awareness", {
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true,
    useFindAndModify: false
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: "thisshouldbeabettersecret!",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60*60*24*7,
        maxAge: 1000 * 60*60*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());

// Using Passcode for authentication
// Documentation to be found at: http://www.passportjs.org/docs/authenticate/
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


// Has to do with storing the user in a session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// FLash
app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// Connecting to the models.
app.use("/", usersRoutes);
app.use("/notifications", notifications);
app.use("/", groupRoutes);

// Rendering the "home" tab
app.get("/", (req, res)=>{
    res.render("home")
});

// error handeling
app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404))
});

// error
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

// Just notifying connection to server
app.listen(3000, ()=>{
    console.log("serving on port 3000")
})

