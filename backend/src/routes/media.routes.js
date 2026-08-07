import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { db } from '../config/database.js';
import { ApiError } from '../middleware/error.middleware.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = Router();

// Get all media (public)
router.get('/', async (req, res, next) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;

    const media = await db.media.findMany({
      where: {
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await db.media.count({
      where: {
        ...(type && { type }),
      },
    });

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Upload media (admin only)
router.post('/upload', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      throw new ApiError(400, 'No file uploaded', 'NO_FILE');
    }

    const file = req.files.file;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ApiError(400, 'File type not allowed', 'INVALID_TYPE');
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Move file
    await file.mv(filepath);

    // Determine media type
    let mediaType = 'image';
    if (file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.mimetype === 'image/gif') {
      mediaType = 'gif';
    }

    // Save to database
    const media = await db.media.create({
      data: {
        filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        type: mediaType,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.userId,
      },
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: media,
    });
  } catch (error) {
    next(error);
  }
});

// Delete media (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const media = await db.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new ApiError(404, 'Media not found', 'MEDIA_NOT_FOUND');
    }

    // Delete file from disk
    const filepath = path.join(process.cwd(), media.url);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    await db.media.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;