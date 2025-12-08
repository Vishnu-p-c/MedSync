const router = require('express').Router();
const User = require('../models/User');

router.post('/', async (req, res) => {
  const {username, email, password} = req.body;

  // Allow login with either username or email
  const user =
      await User.findOne({$or: [{username: username}, {email: email}]});

  if (!user) return res.json({status: 'fail', message: 'user_not_found'});

  if (password !== user.password_hash) {
    return res.json({status: 'fail', message: 'incorrect_password'});
  }

  res.json({status: 'success', user_id: user.user_id, role: user.role});
});

module.exports = router;
