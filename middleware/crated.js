const templateCopy = require('../models/create');
const ErrorResponse = require('../utils/errorResponse')

exports.crated = async (req, res, next) =>{
    try {
        const predict = await templateCopy.findOne ({ booking })

        req.prediction = predict;

        next();
    } catch (error) {
        return res.status(400).json({message: error.message}) 
    }
};