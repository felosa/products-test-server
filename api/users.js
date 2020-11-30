const express = require("express");
const {
  query,
  validationResult,
  matchedData,
  param,
  body,
} = require("express-validator");
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
  const userName = req.body.user;
  const password = req.body.password;
  let loadedUser;

  knex("users")
    .leftJoin("user_rols", "user_rols.idUser", "users.id")
    .select(
      "users.id as idUser",
      "user",
      "password",
      "user_rols.role",
      "user_rols.idEntity as id"
    )
    .where("user", userName)
    .first()
    .then(async (user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found.");
        error.statusCode = 401;
        throw error;
      }

      if (user.role === "ROLE_STUDENT") {
        await knex("students")
          .leftJoin("courses", "courses.idStudent", "students.id")
          .select()
          .where("students.id", user.id)
          .first()
          .then((result) => {
            user.permission = result.permission;
            user.centerID = result.idCenter;
          });
      }

      if (user.role === "ROLE_TEACHER") {
        await knex("teachers")
          .select()
          .where("teachers.id", user.id)
          .first()
          .then((result) => {
            user.permission = result.permission;
            user.centerID = result.idCenter;
          });
      }

      loadedUser = user;
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
          userId: loadedUser.idUser,
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

  console.log(token, "viene el token");
  if (!token) {
    return res.status(401).json({ message: "Must pass token" });
  }
  // Check token that was passed by decoding token using secret
  jwt.verify(token, "somesupersecretsecret", function (err, user) {
    console.log(err, "error");
    if (err) {
      res.json({
        user: "",
      });
    }

    console.log(user, "user");
    //return user using the id from w/in JWTToken
    knex("users")
      .leftJoin("user_rols", "user_rols.idUser", "users.id")
      .select(
        "users.id as idUser",
        "user",
        "password",
        "user_rols.role",
        "user_rols.idEntity as id"
      )
      .where("users.id", user.userId)
      .first()
      .then(async (user) => {
        console.log(user, "este es el user");
        if (user.role === "ROLE_STUDENT") {
          await knex("students")
            .leftJoin("courses", "courses.idStudent", "students.id")
            .select()
            .where("students.id", user.id)
            .first()
            .then((result) => {
              user.permission = result.permission;
              user.centerID = result.idCenter;
            });
        }
        // user = utils.getCleanUser(user);
        //Note: you can renew token by creating new token(i.e.
        //refresh it)w/ new expiration time at this point, but I’m
        //passing the old token back.
        // var token = utils.generateToken(user);
        res.json({
          user: user,
          token: token,
        });
      });
  });
});

module.exports = router;
