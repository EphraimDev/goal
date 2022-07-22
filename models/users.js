const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { GENERATEOTP } = require('../utils/otp');

const template = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    phone:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    confirmAccountToken: String,
    confirmAccountExpire: Date,

    isVerified:{
        type: Boolean,
        default: false,
    }
});

template.pre('save', async function(next){
    if(!this.isModified('password')){
        next()
    }
})

template.methods.getSignedToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE})
}

template.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    //this.resetPasswordToken = GENERATEOTP();

    this.resetPasswordExpire = Date.now() + 1 * (60 * 1000);
    return this.resetPasswordToken;
}

template.methods.getConfirmAccountToken = function(){
    const confirmToken = crypto.randomBytes(20).toString('hex');
    this.confirmAccountToken = crypto.createHash('sha256').update(confirmToken).digest('hex');

    this.confirmAccountExpire = Date.now() + 60 * (60 * 1000);
    return this.confirmAccountToken;
}

module.exports = mongoose.model('users', template);