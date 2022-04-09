const mongoose = require('mongoose');

const template = new mongoose.Schema({
    booking:{
        type: String,
    },
    platform:{
        type: String,
    },
    first:{
        type: String,
    },
    start:{
        type: String,  
    },
    last:{
        type: String,
    },
    end:{
        type: String,
    },
    subject:{
        type: String,
    },
    message:{
        type: String,
    },
    date:{
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('create', template);