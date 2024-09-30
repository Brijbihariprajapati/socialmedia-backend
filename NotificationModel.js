const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    userid:{
        type:String,
        require:true
    },
    postuserid:{
        type:String,
        require:true
    },
    Status:{
        type:Number,
        require:true
    },
    Type:{
        type:String,
        require:true
    },
    Notification:{
        type:String,
        require:true
    },
    postid:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    }
})

const Notification = mongoose.model('Notification',schema)

module.exports = Notification