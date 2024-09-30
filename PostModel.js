// models/User.js

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  username: { type: String, required: true, },
  status: {
    type: String,
    default: "active",
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
});

const User = mongoose.model("Post", postSchema);

module.exports = User;
