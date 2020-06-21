const express = require("express");
const { query,
  validationResult,
  matchedData,
  param,
  body } = require("express-validator") ;
const knex = require("../db/knex"); //the connection
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// CREAR USER
router.post("/", [body("user"), body("password")], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const data = matchedData(req, { includeOptionals: true });

  console.log(data, "user");
  bcrypt.genSalt(10).then((salt, err) => {
    if (err) {
      this.logger.logError(err, "registerUser");

      reject(err);
    }

    bcrypt.hash(data.password, salt).then((hash, err) => {
      if (err) {
        this.logger.logError(err, "registerUser");

        reject(err);
      }

      knex("users")
        .insert({
          user: data.user,
          password: hash,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .then(([newID]) => {
          return res.json({ newID });
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    });
  });
});

// LOGUEAR USUARIO
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

// COMPROBAR SI EL USUARIO ESTA LOGUEADO(REVISAR SI SE USA TOKEN O ALGO MAS)
router.get("/isLoged/:token", (req, res, next) => {
  // check header or url parameters or post parameters for token
  var token = req.params.token || req.query.token;
  if (!token) {
    return res.status(401).json({ message: "Must pass token" });
  }
  // Check token that was passed by decoding token using secret
  jwt.verify(token, "somesupersecretsecret", function (err, user) {
    if (err) throw err;
    console.log(user.userId);
    //return user using the id from w/in JWTToken
    knex("users")
      .where("id", user.userId)
      .first()
      .then((response) => {
        console.log(response);
        // user = utils.getCleanUser(user);
        //Note: you can renew token by creating new token(i.e.
        //refresh it)w/ new expiration time at this point, but I’m
        //passing the old token back.
        // var token = utils.generateToken(user);
        res.json({
          user: response,
          token: token,
        });
      });
  });
});
module.exports = router;
