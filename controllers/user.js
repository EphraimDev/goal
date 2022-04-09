exports.userProfile = async (req, res) =>{
    return res.json(req.user)
};