//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/css", express.static(path.resolve(__dirname, "assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "assets/js")));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

var cardsArray = [
  {
    id: "01",
    title: "Dhirubhai Ambani Scholarship Programme",
    description:
      "Pursue your academic aspiration in the field of engineering, medical, law, pharmacy, science, business management and other social sciences with this scholarship.",
    Eligibility: "12th Passout",
  },
  {
    id: "01",
    title: "SERB Ramanujan Fellowships",
    description: "To encourage outstanding engineers and scientists worldwide.",
    Eligibility: "Masters",
  },
  {
    id: "01",
    title: "Law degree from Harvard Law",
    description:
      "Pearson Specter is offering 3 fully funded scholarhips for Law degree from Harvard!",
    Eligibility: "Undergraduate",
  },
  {
    id: "01",
    title: "Master in Germany",
    description:
      "Dusseldorf governement is offering 10 fully funded scholarhips for Masters in Germany!",
    Eligibility: "Masters",
  },
  {
    id: "01",
    title: "Bachelors in Canada",
    description:
      "Jain foundation is offering 4 fully funded scholarhips for bachelors in Canada!",
    Eligibility: "Undergraduate",
  },
  {
    id: "01",
    title: "Ratan Tata scholarship",
    description:
      "This scholarship is provided to 20 students at a time by the Tata Education and Development Trust. ",
    Eligibility: "12th Passout",
  },
];

var jobArray = [
  {
    id: "01",
    title: "Microsoft",
    description:
      "Microsoft Corporation is a corporation which produces computer software, consumer electronics, personal computers, and related services.",
    rolesAvailable: "Data Manager",
    openings: 7,
  },
  {
    id: "01",
    title: "Apple",
    description:
      "Apple Inc. is an American multinational  company that specializes in consumer electronics, software and online services.",
    rolesAvailable: "Product Manager",
    openings: 5,
  },
  {
    id: "01",
    title: "Facebook",
    description:
      "The company is the parent organization of Facebook, Instagram, and WhatsApp, among other subsidiaries.",
    rolesAvailable: "Assisstant Manager",
    openings: 2,
  },{
    id: "01",
    title: "Audi",
    description:
      "Audi AG is a German automobile manufacturer that designs, engineers, produces, markets and distributes luxury vehicles.",
    rolesAvailable: "Sales Manager",
    openings: 8,
  },{
    id: "01",
    title: "Netfix",
    description:
      "Netflix, Inc. is an American subscription streaming service and production company.",
    rolesAvailable: "Data Manager",
    openings: 3,
  },{
    id: "01",
    title: "SBI",
    description:
      "State Bank of India is an Indian multinational public sector bank and financial services statutory body",
    rolesAvailable: "Receptionist",
    openings: 5,
  },
];

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/out", function (req, res) {
  res.sendFile(__dirname + "/public/index2.html");
});

//no need for home
app.get("/hire", (req, res) => {
  res.render("index", {
    cardsArray: cardsArray,
  });
});
app.get("/hire-now", (req, res) => {
  res.render("add_job");
});
app.post("/hire-now", (req, res) => {
  const object = {
    id: req.body.id,
    title: req.body.name,
    description: req.body.des,
    Eligibility: req.body.elig,
  };
  cardsArray.push(object);
  res.redirect("/hire");
});

app.get("/jobhire", (req, res) => {
  res.render("index3", {
    jobArray: jobArray,
  });
});
app.get("/jobhire-now", (req, res) => {
  res.render("add_scholarship");
});
app.post("/jobhire-now", (req, res) => {
  const object = {
    id: req.body.id,
    title: req.body.name,
    description: req.body.des,
    rolesAvailable: req.body.role_ava,
    openings: req.body.no_of_opening,
  };
  jobArray.push(object);
  res.redirect("/jobhire");
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
         res.redirect("/out");
      }
    }
  });
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
app.get("contact", (req, res) => {
  res.sendFile(__dirname + "contact/index.html");
});

app.get("training", (req, res) => {
  res.sendFile(__dirname + "training/index.html");
});
