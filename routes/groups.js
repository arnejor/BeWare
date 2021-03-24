const express = require("express");
const catchAsync = require("../utils/catchAsync");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
// FIX THIS TO THE .env FILE
const geocoder = mbxGeocoding({ accessToken: "pk.eyJ1IjoiYXJuZWpvciIsImEiOiJja2xrZ3RjaXgwNGxsMndtd2c1dGdiOWhzIn0.yx2qojumUfuRN-4AX2Cxow" });

const router = express.Router();
const User = require("../models/user");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const Group = require("../models/groups");
const { isLoggedIn } = require("../middleware");

// Searching for groups
router.get("/groups/search", isLoggedIn, catchAsync(async(req, res, next) => {
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
router.post("/groups/:id/new", isLoggedIn, catchAsync(async(req, res) => {
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


router.get("/:id/groups", isLoggedIn, catchAsync(async(req, res) => {
    groups = await Group.find({}); 
    const user = await User.findById(req.user.id).populate("groups");

    
    console.log(req.params.id)
    res.render("users/user", { groups, user });
}));


// leaving groups
router.post("/groups/:id/leave/:groupId", catchAsync(async(req, res) =>{
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
  
  






router.get("/add", isLoggedIn, catchAsync(async(req, res)=> {
    res.render("users/add")
}));

router.get("/join", isLoggedIn, catchAsync(async(req, res)=> {
    res.render("users/join")
}));

// THis lets the user join groups <3 <3 <3 <3 <3 <3 <3
router.post("/groups/:id/join/:groupId", catchAsync(async(req, res) =>{
    

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



router.delete("/groups/:id/delete/:groupId", catchAsync(async(req, res) =>{
    const { id, groupId } = req.params;
    await User.findByIdAndUpdate(id, {$pull: {groups: groupId}})



    await Group.findByIdAndDelete(groupId);
    req.flash("success", "Successfully deleted group");
    res.redirect("/${user._id}/groups");
}));


module.exports = router;

