var  User = require("../models/users");
var  jwt = require("jsonwebtoken");

const SENDOTP = (req,res) => {
    sendOtp.send(req.body.phoneNumber, "***senderID***", (err, data) => {
        if (err) return  res.json({ err });
        data.type == "success"
        ? res.json({ success:  true })
        : res.json({ success:  false });
    });
}
const VERIFYOTP = (req,res) => {
    sendOtp.verify(req.body.phoneNumber, req.body.otp, function(err, data) {
        if (err) return  res.json({ err });
        if (data.type == "success") {
            let { phoneNumber } = req.body;
            User.findOne({ phoneNumber }, (err, user) => {
                if (err) return  res.json({ err });
                if (!user) {

                    User.create(req.body, (err, user) => {
                        if (err) return  res.json({ err });
                        jwt.sign(
                            {
                                userId:  user._id,
                                phoneNumber:  user.phoneNumber
                            },
                            "thisissecret",
                            (err, signuptoken) => {
                                if (err) return  res.json({ err });
                                res.json({
                                    success:  true,
                                    signuptoken,
                                    userId:  user._id,
                                    message:  "registered successfully"
                                });
                            }
                        );
                    });
                }
                if (user) {

                    jwt.sign(
                        {
                            userId:  user._id,
                            phoneNumber:  user.phoneNumber
                        },
                        "thisissecret",
                        (err, logintoken) => {
                            if (err) return  res.json({ err });
                            res.json({ logintoken, userId:  user._id });
                        }
                    );
                }
            });
        }
        if (data.type == "error") res.json({ success:  false, message:  data.message });
    });
}
const GENERATEOTP = () => Math.floor(100000 + Math.random() * 900000)
module.exports = { SENDOTP, VERIFYOTP, GENERATEOTP }