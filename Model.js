const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    className: {
        type: String,
        required: true,
    },
    rollNo: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        // required: true
    },
    joiningDate: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        enum: ['Admin', 'User'],  // Only allow 'Admin' or 'User' as values
        required: true,
    }
});

const formData = mongoose.model("Form", Schema);

module.exports = formData;
