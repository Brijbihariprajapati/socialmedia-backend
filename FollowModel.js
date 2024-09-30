const mongoose = require('mongoose')

const followSchema = new mongoose.Schema({
    UserID:{
        type:String,
        require:true
    },
    followId:{
        type:String,
        require:true
    },
    followUserName:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    }
})

const follow = mongoose.model('follow',followSchema)
module.exports = follow