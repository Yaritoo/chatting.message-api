const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    content: String,
    createdTime: Date,
    replyMessageId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    roomId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', required: true
    }
})

messageSchema.index({userId: 1});

module.exports = mongoose.model('Message', messageSchema);