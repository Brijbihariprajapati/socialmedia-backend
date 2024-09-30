const mongoose =require('mongoose')
const URL = 'mongodb+srv://BrijBihariPrajapati:RAJU@cluster0.njmvvcx.mongodb.net/?retryWrites=true&w=majority'
const dbconnect = mongoose.connect(URL).then(()=>{
    console.log("Connection succesfull");
}).catch(error=>console.log(error))

module.exports ={dbconnect}