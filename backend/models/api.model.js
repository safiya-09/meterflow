const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a name for the API'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    baseUrl: {
        type: String,
        required: [true, 'Please add a target base URL'],
        match: [
            /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
            'Please add a valid URL'
        ]
    },
    version: {
        type: String,
        default: 'v1'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Api', apiSchema);
