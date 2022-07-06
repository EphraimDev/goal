const templateCopy = require('../models/create');

exports.created = async (req, res, next) =>{
    try {
        const predictions = await templateCopy.find().
        populate({ path: "author" })
        return res.status(200).json({
            result: predictions
        });
    } catch (error) {
        next(error)
    }
}