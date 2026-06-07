import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'connectsphere_secret_key_123';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'connectsphere_refresh_key_456';

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      username,
      email,
      passwordHash: password, // Pre-save hook will hash this
      verificationToken,
      isVerified: false // Must verify email
    });

    await newUser.save();

    // Mock Email Verification log
    console.log(`\n========================================`);
    console.log(`[EMAIL SIMULATOR] Email sent to: ${email}`);
    console.log(`Verify link: http://localhost:3000/verify-email?token=${verificationToken}`);
    console.log(`========================================\n`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check server logs for verification link.',
      verificationToken // returned in dev mode for ease
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Verify password using User instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        isVerified: false
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token to user array
    user.refreshTokens.push(refreshToken);
    // Set status online on login
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Set secure cookie for refreshToken
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        status: user.status,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }

    const user = await User.findOne({ refreshTokens: token });
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
    }

    jwt.verify(token, REFRESH_TOKEN_SECRET, async (err: any, decoded: any) => {
      if (err) {
        // Token expired or invalid, remove it
        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        await user.save();
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
      }

      const tokens = generateTokens(user);

      // Rotate refresh token
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      const user = await User.findOne({ refreshTokens: token });
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        user.status = 'offline';
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Mock Email Reset log
    console.log(`\n========================================`);
    console.log(`[EMAIL SIMULATOR] Reset password for: ${email}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`========================================\n`);

    res.status(200).json({
      success: true,
      message: 'Password reset link printed to console logs.',
      resetToken // returned in dev mode
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.passwordHash = password; // Pre-save hook will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Clear sessions
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};
