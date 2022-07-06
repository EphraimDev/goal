const mongoose = require('mongoose');
const templateCopy = require('../models/users');
const predict = require('../models/create');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const errorHandler = require('../middleware/error');
const {sendConfirmAccountEmail} = require('../utils/confirmEmail')

exports.signup = async (req, res, next) =>{
    try {
        const saltPassword = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(req.body.password, saltPassword);

        const user = new templateCopy({
            ...req.body
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
        sendConfirmAccountEmail(user)
        sendToken(user, 201, res)
    }catch (error){
        next (error);
    }
};

exports.verify = function (req, res, next) {
    templateCopy.findOne({ confirmAccountToken }, function (err, user) {
        // not valid user
        if (!user){
            return res.status(401).send({msg:'We were unable to find a user for this verification. Please SignUp!'});
        } 
        // user is already verified
        else if (user.isVerified){
            return res.status(200).send('User has been already verified. Please Login');
        }
        // verify user
        else{
            // change isVerified to true
            user.isVerified = true;
            user.save(function (err) {
                // error occur
                if(err){
                    return res.status(500).send({msg: err.message});
                }
                // account successfully verified
                else{
                  return res.status(200).send('Your account has been successfully verified');
                }
            });
        }
    });
}

exports.resendLink = function (req, res, next) {

    templateCopy.findOne({ email: req.body.email }, function (err, user) {
        // user is not found into database
        if (!user){
            return res.status(400).send({msg:'We were unable to find a user with that email. Make sure your Email is correct!'});
        }
        // user has been already verified
        else if (user.isVerified){
            return res.status(200).send('This account has been already verified. Please log in.');
    
        } 
        // send verification link
        else{
            token.save( async function (err) {
                if (err) {
                  return res.status(500).send({msg:err.message});
                }

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
            });
        }
    });
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
        if(!user.isVerified){
            return errorHandler({message: "Email not verified", statusCode: 400}, res)
        }
    }catch(error){
        return errorHandler({message: "Check your Internet", statusCode: 500}, res)
    }
};

exports.create = async (req, res, next) =>{
    try {
        const prediction = new predict({
            ...req.body,
            author: req.user._id,
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
    const { emailOrPhone } = req.body;

    try {
        const user = await templateCopy.findOne({$or: [{email: emailOrPhone}, {phone: emailOrPhone}]});

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

    const { emailOrPhone } = req.body;

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