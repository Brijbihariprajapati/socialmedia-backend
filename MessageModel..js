const mongoose = require("mongoose");

const { Types } = mongoose;

const message = new mongoose.Schema({
  UserID: {
    type: Types.ObjectId,
    ref: "Form",
    required: true,
  },
  postid: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const Messages = mongoose.model("Message", message);

module.exports = Messages;
