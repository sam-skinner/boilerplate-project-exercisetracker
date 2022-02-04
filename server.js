const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const e = require("express");
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
  count: { type: Number, default: 0 },
});
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//CREATE User
app.post("/api/users", (req, res) => {
  User.create({ username: req.body.username }, (err, user) =>
    err
      ? res.json({ error: err })
      : res.json({ username: user.username, _id: user._id })
  );
});

//GET All Users
app.get("/api/users", (req, res) => {
  User.find({}, (err, userList) =>
    err
      ? res.json({ error: err })
      : res.json(
          userList.map(user => ({
            username: user.username,
            _id: user._id,
          }))
        )
  );
});

//UPDATE User Exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  User.findById(req.params["_id"], (err, user) => {
    if (err) return res.json({ error: err });
    const exercise = {
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
        ? req.body.date
        : new Date().toISOString().split("T")[0],
    };
    user.log.push(exercise);
    user.count = user.log.length;
    user.save((err, user) =>
      err
        ? res.json({ error: err })
        : res.json({
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date,
            _id: user._id,
          })
    );
  });
});

//GET One User Logs
app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params["_id"], (err, user) => {
    if (err) return res.json({ error: err });

    let log = user.log;
    if (req.query.from) {
      log = log.filter(
        exercise => new Date(exercise.date) >= new Date(req.query.from)
      );
    }
    if (req.query.to) {
      log = log.filter(exercise => exercise.date <= req.query.to);
    }
    if (req.query.limit) {
      log.splice(req.query.limit);
    }
    return res.json({
      username: user.username,
      count: user.count,
      _id: user._id,
      log: log,
    });
  });
});

//DELETE All Users
app.get("/api/users/delete", (req, res) => {
  User.remove({}, (err, count) =>
    err ? res.json({ error: err }) : res.json(count)
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
