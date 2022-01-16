const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    userIds: [
        {
            type: String,
            required: true
        }
    ]
})
roomSchema.index({userIds: 1});
module.exports = mongoose.model('Room', roomSchema);