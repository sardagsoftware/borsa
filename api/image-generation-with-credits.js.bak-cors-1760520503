/**
 * Image Generation API with Credits System
 * Integrated gallery, credits management, and authentication
 */

const OpenAI = require('openai');
const { getDatabase } = require('../database/init-db');
const User = require('../backend/models/User');

// Image generation costs 10 credits
const IMAGE_GENERATION_COST = 10;

/**
 * Verify token and get user
 */
const authenticateRequest = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const decoded = User.verifyToken(token);
  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  const user = User.findById(decoded.id);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Save generated image to database
 */
const saveGeneratedImage = (userId, prompt, imageUrl, modelUsed, parameters) => {
  const db = getDatabase();
  try {
    db.prepare(`
      INSERT INTO generated_images (userId, prompt, imageUrl, modelUsed, creditsUsed, parameters)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, prompt, imageUrl, modelUsed, IMAGE_GENERATION_COST, JSON.stringify(parameters));
  } finally {
    db.close();
  }
};

/**
 * Get user's image gallery
 */
const getUserGallery = (userId, limit = 50, offset = 0) => {
  const db = getDatabase();
  try {
    const images = db.prepare(`
      SELECT id, prompt, imageUrl, modelUsed, creditsUsed, createdAt
      FROM generated_images
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM generated_images WHERE userId = ?
    `).get(userId);

    return {
      images,
      total: total.count,
      limit,
      offset
    };
  } finally {
    db.close();
  }
};

/**
 * Generate image using OpenAI DALL-E
 */
const generateWithDALLE = async (prompt, size = '1024x1024', quality = 'standard') => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: size,
    quality: quality
  });

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
    model: 'DALL-E 3'
  };
};

/**
 * Main Image Generation Handler
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Retrieve user's image gallery
  if (req.method === 'GET') {
    try {
      const user = authenticateRequest(req);
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const gallery = getUserGallery(user.id, limit, offset);

      return res.status(200).json({
        success: true,
        ...gallery,
        user: {
          id: user.id,
          name: user.name,
          subscription: user.subscription,
          credits: user.credits
        }
      });

    } catch (error) {
      console.error('Get gallery error:', error);
      return res.status(401).json({
        success: false,
        error: error.message || 'Failed to get image gallery'
      });
    }
  }

  // POST - Generate new image
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = authenticateRequest(req);

    const {
      prompt,
      size = '1024x1024',
      quality = 'standard'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Validate prompt length
    if (prompt.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be at least 3 characters long'
      });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be less than 4000 characters'
      });
    }

    // Check credits
    if (user.credits < IMAGE_GENERATION_COST) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient credits',
        required: IMAGE_GENERATION_COST,
        available: user.credits
      });
    }

    // Validate size
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid size. Must be one of: ' + validSizes.join(', ')
      });
    }

    // Validate quality
    const validQualities = ['standard', 'hd'];
    if (!validQualities.includes(quality)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality. Must be one of: ' + validQualities.join(', ')
      });
    }

    console.log(`Generating image for user ${user.id}: ${prompt}`);

    // Generate image
    const result = await generateWithDALLE(prompt, size, quality);

    // Save to database
    const parameters = { size, quality, revisedPrompt: result.revisedPrompt };
    saveGeneratedImage(user.id, prompt, result.url, result.model, parameters);

    // Deduct credits and update usage
    User.updateUsage(user.id, {
      imagesGenerated: 1,
      creditsUsed: IMAGE_GENERATION_COST
    });

    // Log activity
    User.logActivity({
      userId: user.id,
      action: 'image_generated',
      description: `Generated image using ${result.model}`,
      metadata: { prompt, size, quality, credits: IMAGE_GENERATION_COST }
    });

    // Get updated user info
    const updatedUser = User.findById(user.id);

    res.status(200).json({
      success: true,
      image: {
        url: result.url,
        prompt: prompt,
        revisedPrompt: result.revisedPrompt,
        model: result.model,
        size: size,
        quality: quality
      },
      credits: {
        used: IMAGE_GENERATION_COST,
        remaining: updatedUser.credits
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image Generation Error:', error);

    const statusCode = error.message.includes('Authentication') ? 401 :
                       error.message.includes('Insufficient') ? 403 :
                       error.message.includes('not configured') ? 503 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
