const createError = require("http-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const whitelist = [
  "http://localhost:3000",
  "https://beta2020.autius.com",
];
const corsOptions = {
  origin: function (origin, callback) {
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  },
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));

const users = require("./api/users");
const centers = require("./api/centers");
const teachers = require("./api/teachers");
const students = require("./api/students");
const vehicles = require("./api/vehicles");
const permissions = require("./api/permissions");
const archings = require("./api/archings");
const classTypes = require("./api/classTypes");
const closures = require("./api/closures");
const hows = require("./api/hows");
const tariffs = require("./api/tariffs");
const exams = require("./api/exams");
const patterns = require("./api/patterns");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/users", users);
app.use("/api/centers", centers);
app.use("/api/teachers", teachers);
app.use("/api/students", students);
app.use("/api/vehicles", vehicles);
app.use("/api/permissions", permissions);
app.use("/api/archings", archings);
app.use("/api/classTypes", classTypes);
app.use("/api/closures", closures);
app.use("/api/hows", hows);
app.use("/api/tariffs", tariffs);
app.use("/api/exams", exams);
app.use("/api/patterns", patterns);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = app;
