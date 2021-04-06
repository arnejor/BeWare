const express = require("express");                         // 
const bodyParser = require("body-parser");                  //
const webpush = require("web-push");                        //
const path = require("path");                               //
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
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: "pk.eyJ1IjoiYXJuZWpvciIsImEiOiJja2xrZ3RjaXgwNGxsMndtd2c1dGdiOWhzIn0.yx2qojumUfuRN-4AX2Cxow" });
const notifications = require("./routes/notifications");
const groupRoutes = require("./routes/groups");
const usersRoutes = require("./routes/users");
const { isLoggedIn } = require("./middleware");
const user = require("./models/user");
const cors = require('cors');
const dotenv = require('dotenv');
const bodyparser = require('body-parser');


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
app.use(bodyParser.json());




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


//  storing the user in a session
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

// Connecting to the routes.
app.use("/", usersRoutes);
app.use("/notifications", notifications);
app.use("/", groupRoutes);


//////// new version/////////////////////////////////////////////////////////////////


//// for now lets create an array for db, to store all subscriptions
//let testdb = [];
//
//const vapidKeys = {
//  publicKey:
//'BO3Z3OvRZVv_N36CUhuGfYBKlELXwVKboqas7Y2szIY4N2_ge0WyxP_Zr6UjXL3I50BofDzBBQVdDVzvJ_90OXM',
//  privateKey: 'EPzHUZp0eKL-tgC_YJM3lVyPyaP13jpCOi7ox1508B4'
//};
//
//webpush.setVapidDetails(
//  'mailto:test@test.test',
//  vapidKeys.publicKey,
//  vapidKeys.privateKey
//);
//
//
//app.use(express.static('public'));
//app.use(bodyparser.urlencoded({extended: true}));
//app.use(bodyparser.json());
//
//
//app.post('/api/save-subscription/', function (req, res) {
//  if (!isValidSaveRequest(req, res)) {
//    return;
//  }
//
//  return saveSubscriptionToDatabase(req.body).then((subscriptionId) => {
//    console.log(testdb);
//    console.log('--------------------------------');
//
//    res.setHeader('Content-Type', 'application/json');
//    res.send(JSON.stringify({ data: { success: true } }));
//  }).catch((err) => {
//    res.status(500);
//    res.setHeader('Content-Type', 'application/json');
//    res.send(JSON.stringify({
//    error: {
//      id: 'unable-to-save-subscription',
//      message: 'The subscription was received but we were unable to save it to our database.'
//    }
//    }));
//  });
//});
//
//const isValidSaveRequest = (req, res) => {
//  // console.log(req.body);
//  // console.log('--------------------------------');
//
//  // Check the request body has at least an endpoint.
//  if (!req.body || !req.body.endpoint) {
//    // Not a valid subscription.
//    res.status(400);
//    res.setHeader('Content-Type', 'application/json');
//    res.send(JSON.stringify({
//      error: {
//        id: 'no-endpoint',
//        message: 'Subscription must have an endpoint.'
//      }
//    }));
//    return false;
//  }
//  return true;
//};
//
//const saveSubscriptionToDatabase = (subscription) => {
//  return new Promise((resolve, reject) => {
//    // insert into user subscription into db code here
//    // db.insert(subscription, function(err, newDoc) {
//    //   if (err) {
//    //     reject(err);
//    //     return;
//    //   }
//
//    //   resolve(newDoc._id);
//    // });
//
//    // console.log(db);
//    testdb.push(subscription)
//    resolve(true);
//  });
//};
//
//const getSubscriptionsFromDatabase = () => {
//  return new Promise(resolve => {
//    resolve(testdb);
//  });
//}
//
//
//
//app.post('/api/trigger-push-msg/', (req, res) => {
//  console.log(req.body);
//  var dataToSend = {};
//  dataToSend.title = req.body.title;
//  dataToSend.body = req.body.body;
//
//  return getSubscriptionsFromDatabase()
//  .then((subscriptions) => {
//    // console.log(subscriptions);
//    let promiseChain = Promise.resolve();
//
//    dataToSend = JSON.stringify(dataToSend);
//    for (let i = 0; i < subscriptions.length; i++) {
//      const subscription = subscriptions[i];
//      promiseChain = promiseChain.then(() => {
//        console.log('sending notif to: ' + subscription.endpoint);
//        console.log('');
//        console.log('');
//        console.log('');
//        return triggerPushMsg(subscription, dataToSend);
//      });
//    }
//
//    return promiseChain;
//  }).then(() => {
//    res.setHeader('Content-Type', 'application/json');
//    console.log(dataToSend);
//      res.send(JSON.stringify({ data: { success: true } }));
//  })
//  .catch(function(err) {
//    res.status(500);
//    res.setHeader('Content-Type', 'application/json');
//    res.send(JSON.stringify({
//      error: {
//        id: 'unable-to-send-messages',
//        message: `We were unable to send messages to all subscriptions : ` +
//          `'${err.message}'`
//      }
//    }));
//  });
//
//
//});
//
//
//const triggerPushMsg = (subscription, dataToSend) => {
//  return webpush.sendNotification(subscription, dataToSend)
//  .catch((err) => {
//    if (err.statusCode === 410) {
//      // return deleteSubscriptionFromDatabase(subscription._id);
//    } else {
//      console.log('Subscription is no longer valid: ', err);
//    }
//  });
//};





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// order matters. The push notification request must be below the session definition
// Adding push notifications/////////////////////////////////////////////////////////////////////////////////////////
//app.use(express.static(path.join(__dirname, "client")));
//
//// VAPID keys for push notifications and setting details with web-push module
//
const vapidKeys = {
  publicKey:
"BMEYuTpkeJkCo38EzLhz3e3m8fDpE-oqlIdYZz8HKL4GOQs5EoWLI3B22FO8qDdTvyHGMG9SglTZIqj492yjLxM",
  privateKey: "ZXgaDlmPAc8ZEcHhXnEu1qkLMD_RsokEGn2bfZmalOA"

};

webpush.setVapidDetails(
  'mailto:web-push-book@gauntface.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


// returns the subscriptions from the database



// This function triggers the push message. It is called in the logig of sending push notifications above
const triggerPushMsg = function(subscription, dataToSend) {
  console.log(subscription);
  const testSubscription = JSON.stringify(subscription);
  console.log("trying to send push...")

  //const fakeSubscription = {
  //  endpoint: "https://fcm.googleapis.com/fcm/send/et1RKlO7A2s:APA91bEiDUg4FCtP5ajbey03c1PGXjr77MSfI0YNMwNbcb6eI0DxMJr1I3twGdHQ_KT1qycXfJGZlJMvqekD1m5-gj2Fh4t5jbwuVvqZeuSD2URLdqc6bEe-dyKuMMj3kYfZwUO2jNJH",
  //  keys: {
  //    auth: "ah0a2XmtKMsc2iAWebd80Q",
  //    p256dh: "BMHJnMeNhG4pbtCyJbZEhTMLrvhO4B4WGvApiNr_j4V2NmO-UIjYDzrlU0V1x_kXx8WIMkhpWKML7WTcYK2TAOY"
  //  }
  //};
  return webpush.sendNotification(subscription, "your push payload text")
  .catch((err) => {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid: ', err);
      return deleteSubscriptionFromDatabase(tsubscription._id);
    } else {
      throw err;
    }
  });
};

// the request for posting a notification. In this test it is via the button.
app.post('/api/trigger-push-msg/', function (req, res) {
  const dataToSend = "test, message haha";
  
  // BUG HERE. THE getSubscription function does not return a subscription. 
  return getSubscriptionsFromDatabase()
  .then(function(subscription) {
    let promiseChain = Promise.resolve();
    console.log("trying to push.");

    for (let i = 0; i <= 1; i++) {
      const subscriptionTest = subscription[i];

      promiseChain = promiseChain.then(() => {
        console.log("please", );
        return triggerPushMsg(subscription[i], dataToSend);
      });
    
    }
    console.log("it worked, actually, but how? Also, what happens now?");
    return promiseChain;
    
  })
  .then(() => {
    res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
  })
  .catch(function(err) {
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: {
        id: 'unable-to-send-messages',
        message: `We were unable to send messages to all subscriptions : ` +
          `'${err.message}'`
      }
    }));
});
})


// saves subscriptions to test DB
const testDB = [];
function saveSubscriptionToDatabase(subscription) {
  return new Promise(function(resolve, reject) {

    testDB.push(subscription);
    console.log(testDB);
  });
};

// get subscriptions
function getSubscriptionsFromDatabase(subscription) {
  return new Promise(function(resolve, reject) {

    var subscription = testDB;

    console.log("this is from get subscription functions",subscription);
  
    resolve(Promise);

  

  });
  
}

//const getSubscriptionsFromDatabase = () => {
//  return new Promise(resolve => {
//    resolve(testDB);
//  });
//}



// Subscribe route
app.post("/subscribe", (req, res)=> {
    const subscription = req.body;
    res.status(201).json({});
    const payload = JSON.stringify({title:"Push Test"});
    webpush.sendNotification(subscription, payload).catch(err=>console.log("ERROR"));
})

// sending the subscription to back end
// there are some validation here to make sure the subscription is a real subscription
app.post('/api/save-subscription/', function (req, res) {
    console.log("TEST please virk");

    // stringifying the subscription object gottn from client
    


    //if (!isValidSaveRequest(req, res)) {
    //  return console.log("not valid");
    //}

    return saveSubscriptionToDatabase(JSON.stringify(req.body))
    .then(function(subscriptionId) {
      console.log("it ran through herer");
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
      //console.log("The suscription was sent to server!!!!!", subscriptionId)
    })
    .catch(function(err) {
      res.status(500);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        error: {
          id: 'unable-to-save-subscription',
          message: 'The subscription was received but we were unable to save it to our database.'
        }
      }));
    });
});





//here is the validation
const isValidSaveRequest = (req, res) => {
  // Check the request body has at least an endpoint.
  
  if (!req.body || !req.body.endpoint) {
    // Not a valid subscription.
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: {
        id: 'no-endpoint',
        message: 'Subscription must have an endpoint.'
      }
    }));
    return false;
  }}
//};  
//
//
/////////////////////////////////////////////////////////////////////////////////////////////////////





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
});

// Just notifying connection to server
app.listen(3000, ()=>{
    console.log("serving on port 3000")
})

