const templateCopy = require('../models/users');
const predict = require('../models/create');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const errorHandler = require('../middleware/error');

exports.signup = async (req, res, next) =>{
    try {
        const saltPassword = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(req.body.password, saltPassword);

        const user = new templateCopy({
            username: req.body.username,
            password: securePassword,
            email: req.body.email,
            phone: req.body.phone
        })

        const {username,
            email
        } = req.body

        let userExists = await templateCopy.findOne({ username });
        if (userExists) {
            return errorHandler({message: "User already exists", statusCode: 400}, res)
        }

        let emailExists = await templateCopy.findOne({ email });
        if (emailExists) {
            return errorHandler({message: "Email already exists", statusCode: 400}, res)
        }

        await user.save();
        sendToken(user, 201, res)
    }catch (error){
        next (error);
    }
};

exports.confirm = async (req, res) =>{
    const { email, phone } = req.body;

    try {
        const user = await templateCopy.findOne({email});

        if(!user){
            return next(new ErrorResponse("Email could not be sent", 404))
        }

        const confirmToken = user.getConfirmPasswordToken();

        await user.save()

        const confirmUrl = `http:localhost:4000/confirm/${confirmToken}`;
        const message = `<h1>Account Confirmation</h1>
            <p>Click on this link to confirm your Account</p>
            <a href = ${confirmUrl} clicktracking = off> ${confirmUrl}</a>
        `
        try {
            await sendEmail({
                to: user.email,
                subject: "Account Confirmation",
                text: message,
            })

            res.status(200).json({
                success: true,
                data: "Email Sent"
            })
        } catch (error) {
            user.confirmPasswordToken = undefined;
            user.confirmPasswordExpire = undefined;

            await user.save();

            return next(new ErrorResponse("Email could not be sent", 500));
        }
    } catch (error) {
        next(error);
    }

}

exports.login = async (req, res) =>{
    try{
        const {username, password} = req.body
        let user = await templateCopy.findOne({ username })

        if(user) {
            const validPassword = await bcrypt.compare(
                password, user.password
            )
            if(validPassword){
                sendToken(user, 200, res)
            }else{
                return errorHandler({message: "Username or Password Incorrect", statusCode: 400}, res)
            }
        }else{
            return errorHandler({message: "User does not exist, Please Sign up", statusCode: 400}, res)
        }
    }catch(error){
        return errorHandler({message: error.message, statusCode: 500}, res)
    }
};

exports.create = async (req, res, next) =>{
    try {
        const prediction = new predict({
            booking: req.body.booking,
            platform: req.body.platform,
            first: req.body.first,
            start: req.body.start,
            last: req.body.last,
            end: req.body.end,
            email: req.body.email,
            phone: req.body.phone
        })
        await prediction.save();
        return res.status(201).json({
            success: true,
            data: prediction
        });
        
    }catch (error){
        next (error);
    }
};

exports.forgotpassword = async (req, res, next) =>{
    const { email } = req.body;

    try {
        const user = await templateCopy.findOne({email});

        if(!user){
            return next(new ErrorResponse("Email could not be sent", 404))
        }

        const resetToken = user.getResetPasswordToken();

        await user.save()

        const resetUrl = `http:localhost:4000/passwordreset/${resetToken}`;
        const message = `<h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password</p>
            <a href = ${resetUrl} clicktracking = off> ${resetUrl}</a>
        `
 
        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                text: message,
            })

            res.status(200).json({
                success: true,
                data: "Email Sent"
            })
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return next(new ErrorResponse("Email could not be sent", 500));
        }
    } catch (error) {
        next(error);
    }
};

exports.resetpassword = async (req, res, next) =>{
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    try {
        const user = await templateCopy.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now}
        })

        if(!user){
            return next(new ErrorResponse("Invalid Request Token", 400));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.status(201).json({
            success: true,
            data: "Password Reset Success"
        })

    } catch (error) {
        next(error);
    }
};

const sendToken = (user, statusCode, res) =>{
    const token = user.getSignedToken();
    res.status(statusCode).json({
        success: true,
        token
    })
};