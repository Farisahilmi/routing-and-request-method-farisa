const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../public/uploads');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');
const originalsDir = path.join(uploadDir, 'originals');

[uploadDir, thumbnailsDir, originalsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for original images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, originalsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1 // 1 file only
  }
});

// Image processing middleware
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const filename = req.file.filename;
    const nameWithoutExt = path.parse(filename).name;

    // Generate thumbnail (200x200)
    const thumbnailPath = path.join(thumbnailsDir, `${nameWithoutExt}-thumb.webp`);
    await sharp(originalPath)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);

    // Generate medium size (500x500)
    const mediumPath = path.join(uploadDir, `${nameWithoutExt}-medium.webp`);
    await sharp(originalPath)
      .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(mediumPath);

    // Convert original to WebP if not already
    const originalWebPPath = path.join(uploadDir, `${nameWithoutExt}.webp`);
    await sharp(originalPath)
      .webp({ quality: 90 })
      .toFile(originalWebPPath);

    // Store paths in request for later use
    req.processedImages = {
      original: `/uploads/${filename}`,
      webp: `/uploads/${nameWithoutExt}.webp`,
      thumbnail: `/uploads/thumbnails/${nameWithoutExt}-thumb.webp`,
      medium: `/uploads/${nameWithoutExt}-medium.webp`
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Error processing image'
    });
  }
};

// Helper function to delete image files
const deleteImageFiles = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;

  try {
    const relativePath = imagePath.replace('/uploads/', '');
    const nameWithoutExt = path.parse(relativePath).name;

    // Delete all related files
    const filesToDelete = [
      path.join(uploadDir, relativePath), // original
      path.join(uploadDir, `${nameWithoutExt}.webp`), // webp version
      path.join(uploadDir, `${nameWithoutExt}-medium.webp`), // medium
      path.join(thumbnailsDir, `${nameWithoutExt}-thumb.webp`) // thumbnail
    ];

    filesToDelete.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error deleting image files:', error);
  }
};

module.exports = {
  upload,
  processImage,
  deleteImageFiles
};
