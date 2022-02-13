const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    category: {
        type: Number,
        required: true
    },
    users: [
        {
            _id: mongoose.Schema.Types.ObjectId,
            status: Number,
            recentTime: Date
        }
    ]
})
roomSchema.index({ users: 1 });
module.exports = mongoose.model('Room', roomSchema);