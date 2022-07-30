const mongoose = require("mongoose");
const templateCopy = require("../models/users");
const predict = require("../models/create");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const errorHandler = require("../middleware/error");
const { sendConfirmAccountEmail } = require("../utils/confirmEmail");

exports.signup = async (req, res, next) => {
  try {
    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, saltPassword);

    const user = new templateCopy({
      ...req.body,
      password: securePassword,
    });

    const { username, email } = req.body;

    let userExists = await templateCopy.findOne({ username });
    if (userExists) {
      return errorHandler(
        { message: "User already exists", statusCode: 400 },
        res
      );
    }

    let emailExists = await templateCopy.findOne({ email });
    if (emailExists) {
      return errorHandler(
        { message: "Email already exists", statusCode: 400 },
        res
      );
    }

    await user.save();
    sendConfirmAccountEmail(user);
    sendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.verify = async (req, res, next) => {
  const { confirmAccountToken } = req.params;

  templateCopy.findOne({ confirmAccountToken }, function (err, user) {
    // not valid user
    if (!user) {
      return res
        .status(401)
        .send(
          "We were unable to find a user for this verification. Please SignUp!"
        );
    }
    //user is already verified
    if (user.isVerified) {
      return res
        .status(200)
        .send("User has been already verified. Please Login");
    }
    if (user.confirmAccountExpire < Date.now()) {
      return res
        .status(400)
        .send("Your token has expired. Please resend a new token");
    }
    // verify user
    else {
      // change isVerified to true
      user.isVerified = true;

      user.confirmAccountToken = undefined;
      user.confirmAccountExpire = undefined;

      user.save(function (err) {
        // error occur
        if (err) {
          return res.status(500).send(err.message);
        }
        // account successfully verified
        else {
          return res
            .status(200)
            .send("Your account has been successfully verified");
        }
      });
    }
  });
  //}
  //})
};

exports.resendLink = function (req, res, next) {
  templateCopy.findOne({ email: req.body.email }, function (err, user) {
    // user is not found into database
    if (!user) {
      return res.status(400).send({
        msg: "We were unable to find a user with that email. Make sure your Email is correct!",
      });
    }
    // user has been already verified
    else if (user.isVerified) {
      return res
        .status(200)
        .send("This account has been already verified. Please log in.");
    }
    // send verification link
    else {
      token.save(async function (err) {
        if (err) {
          return res.status(500).send({ msg: err.message });
        }

        try {
          await sendEmail({
            to: user.email,
            subject: "Account Confirmation",
            text: message,
          });

          res.status(200).json({
            success: true,
            data: "Email Sent",
          });
        } catch (error) {
          user.confirmPasswordToken = undefined;
          user.confirmPasswordExpire = undefined;

          await user.save();

          return next(new ErrorResponse("Email could not be sent", 500));
        }
      });
    }
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await templateCopy.findOne({ username });

    if (!user.isVerified) {
      return errorHandler(
        {
          message:
            "Email not verified, click on the link sent to your mail to verify your account",
          statusCode: 400,
        },
        res
      );
    }

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        sendToken(user, 200, res);
      } else {
        return errorHandler(
          { message: "Username or Password Incorrect", statusCode: 400 },
          res
        );
      }
    } else {
      return errorHandler(
        { message: "User does not exist, Please Sign up", statusCode: 400 },
        res
      );
    }
  } catch (error) {
    return errorHandler(
      { message: "Check your Interweb", statusCode: 504 },
      res
    );
  }
};

exports.create = async (req, res, next) => {
  try {
    const prediction = new predict({
      ...req.body,
      author: req.user._id,
    });
    await prediction.save();
    return res.status(201).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotpassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await templateCopy.findOne({ email });

    if (!user) {
      return errorHandler(
        { message: "user not found, kindly register", statusCode: 404 },
        res
      );
    }

    const resetToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `http:localhost:3000/passwordreset/${resetToken}`;
    const message = `<h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password</p>
            <a href = ${resetUrl} clicktracking = off> ${resetUrl}</a>
        `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({
        success: true,
        data: "Email Sent",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return errorHandler({ message: "invalid email", statusCode: 500 }, res);
    }
  } catch (error) {
    next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  try {
    const user = await templateCopy.findOne({
      resetPasswordToken: req.params.resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send("Invalid reset token. Please resend your password reset token");
    }

    const saltPassword = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, saltPassword);
    user.password = securePassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(201).json({
      success: true,
      data: "Password Reset Success",
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
  });
};