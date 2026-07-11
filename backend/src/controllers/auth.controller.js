const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { recordFailedAttempt, resetFailedAttempts } = require('../middleware/rateLimiter');
const env = require('../config/env');

exports.signup = async (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Please provide all fields: email, password, role, name' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role.toUpperCase() // STUDENT or RECRUITER
      }
    });

    if (user.role === 'STUDENT') {
      await prisma.profile.create({
        data: {
          userId: user.id,
          name,
          skills: []
        }
      });
    } else {
      await prisma.company.create({
        data: {
          userId: user.id,
          name,
          verified: false
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordFailedAttempt(email, ip);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(email, ip);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    let name = '';
    if (user.role === 'STUDENT') {
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      name = profile ? profile.name : 'Student';
    } else {
      const company = await prisma.company.findUnique({ where: { userId: user.id } });
      name = company ? company.name : 'Recruiter';
    }

    // Success - reset locks
    resetFailedAttempts(email, ip);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};
