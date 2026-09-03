const jwt = require('jsonwebtoken');
const env = require('../../config/env');

// Hardcoded administrative credentials
const ADMIN_EMAIL = 'Aligngrad@gmail.com';
const ADMIN_PASSWORD = 'CoMakeDigital12#$';

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Case-insensitive email check and exact password check
    if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email: ADMIN_EMAIL, role: 'ADMIN' },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          email: ADMIN_EMAIL,
          role: 'ADMIN'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  } catch (err) {
    next(err);
  }
};
