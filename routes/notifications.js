const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { notificationSchema } = require("../schemas.js");
const { isLoggedIn } = require("../middleware");
const Group = require("../models/groups");
const User = require("../models/user");
const Response = require("../models/response");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
// FIX THIS TO THE .env FILE
const geocoder = mbxGeocoding({ accessToken: "pk.eyJ1IjoiYXJuZWpvciIsImEiOiJja2xrZ3RjaXgwNGxsMndtd2c1dGdiOWhzIn0.yx2qojumUfuRN-4AX2Cxow" });
// const send = require("../client/client.js");
const webPush = require('web-push');
const bodyParser = require("body-parser");


const ExpressError = require("../utils/ExpressError");
const Notification = require("../models/notification");
const user = require("../models/user");

const validateNotification = (req, res, next) => {
    const { error } = notificationSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}





// This is the index
router.get("/", isLoggedIn, catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.user.id).populate("groups");
    const group = await Group.find({})
    const notifications = await Notification.find({}).sort({
        date: "desc" 
    });

    
    //let arr = [];
    //for(let group1 of user.groups){
    //    arr.push(group1)
    //    
    //};
//
    //const test = await Notification.find( { groups: (arr[0]._id) });
//
    //for(let nei of await Notification.find( { groups: (arr[1]._id) })    ){
    //        test.push(nei)  
    //};
    //function compare( a, b ) {
    //    if ( a.date < b.date ){
    //      return -1;
    //    }
    //    if ( a.date > b.date ){
    //      return 1;
    //    }
    //    return 0;
    //  }
    //  
    //test.sort( compare );


    const notification = await Notification.findById(req.params.id).populate("groups");

    
    res.render("notifications/index", { notifications, group, user })
    
}));


router.delete("/:id/delete", catchAsync(async(req, res, next) =>{
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted notification')
    res.redirect("/notifications")
}));

router.get("/new", isLoggedIn, catchAsync(async(req, res) => {
    //const groups = Group.find({}); 
    const user = await User.findById(req.user.id).populate("groups");
    console.log(user);

    res.render("notifications/new", { user });
     

}));


// Creates a new notification
router.post("/", isLoggedIn, validateNotification, catchAsync(async(req, res, next) => {
    // if(!req.body.notification) throw new ExpressError("Invalid Notification Data", 400);
    
    
    const notification = new Notification(req.body.notification);
    notification.author = req.user._id;
    notification.date = Date();
    console.log(Date());
    const groups = await Group.find({});
    await notification.save();
    req.flash("success", "Successfully created a new notification");
    res.redirect('/notifications');
    
    // Send push notification to all group-members
    console.log(notification.groups)

    const CU = await User.find({ groups: notification.groups });
    console.log("Users to get notified: ");
    console.log(CU);
    

    for(let users of CU){
        console.log(users);
    }
 
}));

// Error handeling and rendering
router.get('/:id', catchAsync(async (req, res,) => {
    const notification = await Notification.findById(req.params.id).populate('responses').populated("author");
    console.log(notification);
    if (!notification) {
        req.flash('error', 'Cannot find that notification!');
        return res.redirect('/notification');
    }
    res.render('notification/show', { notification });
}));


// The response
router.post("/:id/response", isLoggedIn, catchAsync(async(req, res) => {
    const notification = await Notification.findById(req.params.id);
    const response = new Response(req.body.response);
    notification.response.push(response);
    notification.save();
    res.redirect("/notifications")
}))


// This gives the user the edit page, with the fill-ins filled in ;)
router.get("/:id/edit", isLoggedIn, catchAsync(async(req, res) =>{
    const notification = await Notification.findById(req.params.id)
    if (!notification) {
        req.flash('error', 'Cannot find that notification');
        return res.redirect('/notifications');
    }
    res.render("notifications/edit", {notification});
}));




router.put("/:id", isLoggedIn, catchAsync(async(req, res) =>{
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if(!notification.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that")
        return res.redirect("/notifications")
    }
    const note = await Notification.findByIdAndUpdate(id, { ...req.body.notification });
    req.flash("success", "Successfully updated notification");
    res.redirect("/notifications")
}));



module.exports = router;