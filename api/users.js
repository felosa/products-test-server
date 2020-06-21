const express = require("express");
const knex = require("../db/knex"); //the connection
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const queries = require("../db/userqueries");

router.get("/", (req, res) => {
  queries.getAll().then((users) => {
    res.json(users);
  });
});

router.post("/signUp", (req, res) => {
  queries.create(req.body).then((user) => {
    res.json("Introducido");
  });
});

router.post("/upDate/:id", (req, res) => {
  queries.updateUser(req.params.id, req.body).then((user) => {
    res.json("Introducido");
  });
});

router.post("/login", (req, res, next) => {
  console.log(req.body.user, "user");
  const userName = req.body.user;
  const password = req.body.password;
  let loadedUser;

  console.log(userName, password, "valores");

  knex("users")
    .select("user", "password")
    .where("user", userName)
    .first()
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found.");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      console.log(loadedUser, "user");
      var hash = user.password;
      hash = hash.replace(/^\$2y(.+)$/i, "$2a$1");
      return bcrypt.compare(password, hash);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.id,
        },
        "somesupersecretsecret",
        { expiresIn: "3h" }
      );
      console.log(token, "token");
      res.status(200).json({ token: token, user: loadedUser });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
});

router.get("/isLoged/:token", (req, res, next) => {
  queries.isLoged(req, res, next);
});
module.exports = router;
