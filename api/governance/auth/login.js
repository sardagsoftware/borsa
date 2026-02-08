/**
 * Governance Authentication API - Login
 *
 * Handles user authentication for AI Governance Dashboard
 *
 * @module api/governance/auth/login
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, ROLES } = require('../../../middleware/auth-governance');
const { getPrismaClient, safeQuery } = require('../prisma-client');

const router = express.Router();

/**
 * POST /api/governance/auth/login
 *
 * Authenticate user and return JWT token
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   token: string,
 *   user: {
 *     id: string,
 *     email: string,
 *     name: string,
 *     role: string
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Find user
    const result = await safeQuery(
      async prisma => {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
          },
        });

        if (!user) {
          return { success: false, error: 'user_not_found' };
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return { success: false, error: 'invalid_password' };
        }

        // Generate JWT token
        const token = generateToken(user);

        // Create session (optional - for tracking)
        await prisma.session.create({
          data: {
            userId: user.id,
            token: token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown',
          },
        });

        return {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      },
      // Fallback for mock mode
      () => {
        // Mock user for development/testing
        const mockUser = {
          id: 'mock-user-' + Date.now(),
          email: email,
          name: 'Test User',
          role: ROLES.ADMIN,
        };

        const token = generateToken(mockUser);

        return {
          success: true,
          token,
          user: mockUser,
          warning: 'Using mock authentication (database not available)',
        };
      }
    );

    if (!result.success) {
      // Handle authentication errors
      if (result.error === 'user_not_found' || result.error === 'invalid_password') {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid email or password',
        });
      }

      throw new Error(result.error);
    }

    // Success response
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message:
        process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during login',
    });
  }
});

/**
 * POST /api/governance/auth/logout
 *
 * Logout user and invalidate session
 *
 * Requires: Authorization header with JWT token
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    // Invalidate session in database
    await safeQuery(
      async prisma => {
        await prisma.session.deleteMany({
          where: { token },
        });
      },
      () => {
        // Mock mode - no action needed
      }
    );

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * GET /api/governance/auth/me
 *
 * Get current user info from token
 *
 * Requires: Authorization header with JWT token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    // Verify token
    const { verifyToken } = require('../../../middleware/auth-governance');
    const decoded = verifyToken(token);

    // Get user from database
    const user = await safeQuery(
      async prisma => {
        return await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });
      },
      () => {
        // Mock user
        return {
          id: decoded.userId,
          email: decoded.email,
          name: 'Test User',
          role: decoded.role,
          createdAt: new Date(),
        };
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
});

module.exports = router;
