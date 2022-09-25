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
        enum: ['سبتمبر-يناير', 'يناير-مايو', 'مايو-أغسطس']
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('courseFile', CourseFileSchema)