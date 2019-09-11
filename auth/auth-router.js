// Enable tools
const router = require("express").Router();
const Users = require("../models/user-model.js");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const knexSessionStore = require("connect-session-knex")(session);

// // Enable .env
// require("dotenv").config();

// Configure session optionçs
const sessionOptions = {
  name: "cookie",
  secret: "this is my secret",
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  },
  resave: false,
  saveUninitialized: false,
  store: new knexSessionStore({
    knex: require("../database/dbConfig.js"),
    tablename: "sessions",
    sidfieldname: "sid",
    createtable: true,
    clearInterval: 1000 * 60 * 60
  })
};

// Enable middleware
router.use(cors());
router.use(session(sessionOptions));

// Set up endpoints
router.post("/register", (req, res) => {
  console.log("endpoint");
  let user = req.body;
  console.log(user);

  const hash = bcrypt.hashSync(user.password, 10);
  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json(error);
    });
});

router.post("/login", validate, (req, res) => {
  console.log("endpoint hit");
  let { username, password } = req.body;

  req.session.loggedin = false;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.loggedin = true;
        const token = genToken(user);
        res.status(200).json({
          message: `Welcome ${user.username}!`,
          token
        });
      } else {
        res.status(401).json({
          message: "Invalid Credentials"
        });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Server error",
        error
      });
    });
});

router.delete("/logout", (req, res) => {
  console.log(req.session);
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).json({
          message: "you cannot leave this place..."
        });
      } else {
        res.json({ message: "Elvis has left the building" });
      }
    });
  } else {
    res.status(500).json({ message: "Server error" });
  }
});

// Generate a JSON web token
function genToken(user) {
  const payload = {
    subject: "user",
    username: user.username
  };

  const secret = "this is my secret";

  const options = {
    expiresIn: "1h"
  };

  return jwt.sign(payload, secret, options);
}

// Validation middleware 🆔
function validate(req, res, next) {
  console.log("hit");
  const { username, password } = req.body;
  console.log(req.body);
  if (username && password) {
    Users.findBy({ username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          next();
        } else {
          res.status(401).json({ message: "You shall not pass 🛑" });
        }
      })
      .catch(err => {
        res.status(500).json({ message: "unexpected error 🤷‍" });
      });
  } else {
    res.status(400).json({ message: "no credentials provided 🤥" });
  }
}

// Export router 🚀
module.exports = router;
