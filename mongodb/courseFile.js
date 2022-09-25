const mongoose = require('mongoose')
const CourseFileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    term: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('courseFile', CourseFileSchema)