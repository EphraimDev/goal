const jwt = require('jsonwebtoken');
const templateCopy = require('../models/users');
const ErrorResponse = require('../utils/errorResponse')

exports.protect = async (req, res, next ) =>{
    try {
        let token;
        if(req.headers.authorization){
            token = req.headers.authorization.split(" ")[1];
        }
        if(!token){
            return next(new ErrorResponse("Access Denied, Please Login to your Account", 401));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await templateCopy.findById(decoded.id);

        if(!user){
            return next(new ErrorResponse("User Not Found", 404))
        }

        if(!user.isVerified){
            return errorHandler({message: "Email not verified, click on the link sent to your mail to verify your account",
             statusCode: 400}, res)
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}