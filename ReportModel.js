const mongoose = require('mongoose')

const report = new mongoose.Schema({
    reportid:{
        type:String,
        require:true
    },
    reason:{
        type:String,
        require: true
    },
    description:{
        type:String,
        require:true
    },
    postid:{
        type:String,
        require:true
    },
    like:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    }
})

const reports = mongoose.model('report',report)
module.exports = reports;
