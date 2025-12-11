const router = require('express').Router();
const {verificationCodes} = require('./sendVerificationCode');

router.post('/', async (req, res) => {
  try {
    const {email, code} = req.body;

    if (!email || !code) {
      return res.json({status: 'fail', message: 'Email and code are required'});
    }

    // Check if code exists
    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.json({status: 'fail', message: 'Invalid verification code'});
    }

    // Check if code is expired (10 minutes)
    const now = Date.now();
    if (now - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.json({status: 'fail', message: 'Verification code expired'});
    }

    // Verify code
    if (storedData.code !== code.toString()) {
      return res.json({status: 'fail', message: 'Invalid verification code'});
    }

    // Code is valid - remove it after verification
    verificationCodes.delete(email);

    res.json({status: 'success'});
  } catch (error) {
    res.json({status: 'fail', message: error.message});
  }
});

module.exports = router;
