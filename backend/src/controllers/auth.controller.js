const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { recordFailedAttempt, resetFailedAttempts } = require('../middleware/rateLimiter');
const env = require('../config/env');

exports.signup = async (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Please provide all required fields: name, email, password, and role' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const requestedRole = String(role).toUpperCase();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const registeredAs = existingUser.role === 'STUDENT' ? 'Candidate' : 'Recruiter';
      const attemptingAs = requestedRole === 'STUDENT' ? 'Candidate' : 'Recruiter';
      if (existingUser.role !== requestedRole) {
        return res.status(409).json({
          error: `An account with email '${normalizedEmail}' is already registered as a ${registeredAs}. Please sign in through the ${registeredAs} portal or use a different email for your ${attemptingAs} account.`,
          existingRole: existingUser.role
        });
      }
      return res.status(409).json({
        error: `An account with email '${normalizedEmail}' already exists. Please sign in instead.`,
        existingRole: existingUser.role
      });
    }

    const count = await prisma.user.count({
      where: { role: requestedRole }
    });
    const prefix = requestedRole === 'STUDENT' ? 'CAN' : 'REC';
    const regNo = `${prefix}${String(count + 1).padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: requestedRole,
        regNo
      }
    });

    if (user.role === 'STUDENT') {
      await prisma.profile.create({
        data: {
          userId: user.id,
          name: name.trim(),
          email: normalizedEmail,
          skills: []
        }
      });
    } else {
      await prisma.company.create({
        data: {
          userId: user.id,
          name: name.trim(),
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
        name: name.trim(),
        regNo: user.regNo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      recordFailedAttempt(normalizedEmail, ip);
      return res.status(400).json({ error: 'Invalid credentials. Please check your email and password.' });
    }

    // Role check if user attempts to log into wrong portal
    if (role && user.role !== role.toUpperCase()) {
      recordFailedAttempt(normalizedEmail, ip);
      const registeredAs = user.role === 'STUDENT' ? 'Candidate' : 'Recruiter';
      return res.status(403).json({ 
        error: `Access denied. This account is registered as a ${registeredAs}. Please sign in through the ${registeredAs} portal.`,
        expectedPortal: registeredAs
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(normalizedEmail, ip);
      return res.status(400).json({ error: 'Invalid credentials. Please check your email and password.' });
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
    resetFailedAttempts(normalizedEmail, ip);

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
        name,
        regNo: user.regNo || (user.role === 'STUDENT' ? 'CAN001' : 'REC001')
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.googleAuth = async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google OAuth credential is required' });
  }

  const requestedRole = (role || 'STUDENT').toUpperCase();

  try {
    // Verify Google ID token via Google's tokeninfo API
    let googleUser;
    try {
      const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!gRes.ok) {
        throw new Error('Failed to verify Google token');
      }
      googleUser = await gRes.json();
    } catch (gErr) {
      console.error('Google token verification error:', gErr);
      return res.status(400).json({ error: 'Google Sign-In verification failed. Please try again or use email registration.' });
    }

    const { email, name, picture, sub } = googleUser;
    if (!email) {
      return res.status(400).json({ error: 'Your Google account did not provide an email address' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    let isNewUser = false;

    if (!user) {
      // Create new user for first-time Google sign-up
      isNewUser = true;
      const count = await prisma.user.count({
        where: { role: requestedRole }
      });
      const prefix = requestedRole === 'STUDENT' ? 'CAN' : 'REC';
      const regNo = `${prefix}${String(count + 1).padStart(3, '0')}`;

      // Hashed dummy password for OAuth user
      const hashedPassword = await bcrypt.hash(`oauth_google_${sub}_${Date.now()}`, 10);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: requestedRole,
          regNo
        }
      });

      if (user.role === 'STUDENT') {
        await prisma.profile.create({
          data: {
            userId: user.id,
            name: name || 'Candidate',
            email: normalizedEmail,
            profilePic: picture || '',
            skills: []
          }
        });
      } else {
        await prisma.company.create({
          data: {
            userId: user.id,
            name: name || 'Recruiter Company',
            verified: false
          }
        });
      }
    }

    // Role check if existing user attempts to log into the wrong portal
    if (!isNewUser && role && user.role !== role.toUpperCase()) {
      const registeredAs = user.role === 'STUDENT' ? 'Candidate' : 'Recruiter';
      return res.status(403).json({ 
        error: `Your Google account (${normalizedEmail}) is registered as a ${registeredAs}. Please sign in through the ${registeredAs} portal.`,
        expectedPortal: registeredAs
      });
    }

    let displayName = name || '';
    if (user.role === 'STUDENT') {
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      displayName = profile ? profile.name : (name || 'Student');
    } else {
      const company = await prisma.company.findUnique({ where: { userId: user.id } });
      displayName = company ? company.name : (name || 'Recruiter');
    }

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
        name: displayName,
        regNo: user.regNo || (user.role === 'STUDENT' ? 'CAN001' : 'REC001')
      }
    });
  } catch (err) {
    console.error('Google Auth Controller Error:', err);
    res.status(500).json({ error: 'Server error during Google authentication' });
  }
};
