const express = require ('express');
const router = express.Router();

const { signup,
    confirm,
    login,
    forgotpassword,
    resetpassword,
    create,
} = require('../controllers/auth');

const { userProfile } = require('../controllers/user');

const { predictions } = require('../controllers/predictions');

const { protect } = require('../middleware/protect')

const { created } = require('../controllers/created');

const { crated } = require('../middleware/crated')

router.route('/account').get(protect, userProfile);

router.route('/forum').get(protect, userProfile);

router.route('/signup').post(signup);

router.route('/confirm').post(confirm);

router.route('/login').post(login);

router.route('/create').post(create);

router.route('/created').get(crated, created);

router.route('/predictions').get(predictions);

router.route('/forgotpassword').post(forgotpassword);

router.route('/resetpassword/:resetToken').put(resetpassword);

module.exports = router;