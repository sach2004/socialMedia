var express = require("express");
const passport = require("passport");
var router = express.Router();
const userModel = require("./users");
const upload = require('./multer');
const postModel = require('./post')
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));


router.post('/update', isLoggedIn, upload.single('image'), async (req, res) => {
    let updateData = {
        username: req.body.username,
        name: req.body.name,
        Bio: req.body.Bio
    };

    if (req.file) {
        updateData.profileImage = req.file.filename;
    }

    try {
        const user = await userModel.findOneAndUpdate(
            { username: req.session.passport.user },
            updateData,
            { new: true }
        );

        req.login(user, (err) => {
            if (err) {
                console.log(err);
                return res.redirect('/login'); 
            }
            return res.redirect('/profile');
        });
    } catch (err) {
        console.error(err);
      
    }
});

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});

router.get("/feed",isLoggedIn, async function (req, res) {

  const posts = await postModel.find().populate('user');

  console.log(posts);

  res.render("feed", { footer: true, posts });
});

router.get("/profile", isLoggedIn, async function (req, res) {

  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');

  console.log(user);


  res.render("profile", { footer: true, user });
});

router.get("/search",isLoggedIn, function (req, res) {
  res.render("search", { footer: true });
});


router.get("/username/:username", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const users  = await userModel.find({username: regex});

  res.json(users);
});

router.get("/edit",isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("edit", { footer: true , user});
});

router.get("/upload",isLoggedIn, function (req, res) {
  res.render("upload", { footer: true });
});



router.post("/register", function (req, res) {
  var userdata = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userdata, req.body.password).then(function (registeruser) {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.post('/login', passport.authenticate('local', {
  successRedirect:"/profile",
  failureRedirect: "/login"
}), function(req,res) {});


router.post("/upload",isLoggedIn,upload.single('image'), async function (req, res) {
    const user = await userModel.findOne({username: req.session.passport.user});

    const post = await postModel.create({
      
      picture: req.file.filename,
      user : user._id,
      caption: req.body.caption

    })

    user.posts.push(post._id);
    await user.save();

    res.redirect('/feed');
});




module.exports = router;
