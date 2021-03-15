





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
const usersRoutes = require("./routes/users");
const { isLoggedIn } = require("./middleware");
const user = require("./models/user");

// facebook login


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








// trying to add search engine to groups














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

// Rendering the "home" tab
app.get("/", (req, res)=>{
    res.render("home")
});


// Rendering the "myawareness" tab, not finished
app.get("/myawareness", isLoggedIn, catchAsync(async(req, res)=>{
    const user = User.findById(req.params.id);
    res.render("myawareness")
    
}));


// Searching for groups
app.get("/groups/search", isLoggedIn, catchAsync(async(req, res, next) => {
    const groups = Group.find({});
    const q = req.query.groupSearch;
    console.log(q);


    // Group.index({ name: 'text' }) ;
    // const Ad = Local.model('Ad', adSchema);
    // groups.createIndexes();


    groups.find({
        $text: {
            $search: q,
            $caseSensitive: false,
            $diacriticSensitive: false
        }
    }, {
        _id: 0,
        __v: 0
    }, function(err, data) {
        res.json(data)
    })
}));   


// new groups
app.post("/groups/:id/new", isLoggedIn, catchAsync(async(req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.group.location,
        limit: 1
    }).send(); 
    //const user = await User.findById(req.params.id);
    const user = await User.findById(req.user.id)
    const group = new Group(req.body.group);

    group.geometry = geoData.body.features[0].geometry;
    group.author = req.user._id;

    
    await group.save();

    user.groups.push(group);
    await user.save();

    req.flash("success", "Successfully created", group.name);

  
    res.redirect("/${user._id}/groups");
}));


app.get("/:id/groups", isLoggedIn, catchAsync(async(req, res) => {
    groups = await Group.find({}); 
    const user = await User.findById(req.user.id).populate("groups");

    
    console.log(req.params.id)
    res.render("users/user", { groups, user });
}));


// leaving groups
app.post("/groups/:id/leave/:groupId", catchAsync(async(req, res) =>{
    const { id, groupId } = req.params;
    const user = await User.findById(req.params.id);
    const group = await Group.findById(groupId);
    user.groups.pull(group);
    await user.save();

    req.flash('success', 'Successfully left group')
    res.redirect("/${user._id}/groups")
}));



// Group.index({
//     
// });
// const term = 'bergen';
//    
// Group.find({
//     $text: { $search: term },
// })
// .then(groups => console.log(groups))
// .catch(e => console.error(e));
  
  






app.get("/add", isLoggedIn, catchAsync(async(req, res)=> {
    res.render("users/add")
}));

app.get("/join", isLoggedIn, catchAsync(async(req, res)=> {
    res.render("users/join")
}));

// THis lets the user join groups <3 <3 <3 <3 <3 <3 <3
app.post("/groups/:id/join/:groupId", catchAsync(async(req, res) =>{
    

    const { id, groupId } = req.params;
    const user = await User.findById(req.params.id);
    const group = await Group.findById(groupId);
    //console.log(group);
    if (group.password !== req.body.password){
        req.flash("error", "You entered the wrong password.")
        res.redirect("/join")
    }
    console.log(group.password)
    console.log(req.body.password)

    user.groups.push(group);
    await user.save();
    req.flash("success", "Successfully joined", group.name);

    res.redirect("/${user._id}/groups");

}));



app.delete("/groups/:id/delete/:groupId", catchAsync(async(req, res) =>{
    const { id, groupId } = req.params;
    await User.findByIdAndUpdate(id, {$pull: {groups: groupId}})



    await Group.findByIdAndDelete(groupId);
    req.flash("success", "Successfully deleted group");
    res.redirect("/${user._id}/groups");
}));







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

