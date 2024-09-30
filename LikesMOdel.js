
const mongoose = require('mongoose');
const Post = require('./PostModel'); 
const User = require('./Model'); 

const likeSchema = new mongoose.Schema({
  postid: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Post' },
  userid: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  username: { type: String, required: true },
  userlike: { type:String, required:true}

}, { timestamps: true });

likeSchema.index({ postid: 1, userid: 1 , }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
