var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(__dirname, '../data', filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// GET check user status for reviews
router.get('/check-user-status', function(req, res, next) {
  try {
    const { productId } = req.query;
    
    // Check if user is logged in
    const loggedIn = req.session && req.session.user ? true : false;
    
    if (!loggedIn) {
      return res.json({
        success: true,
        loggedIn: false,
        canReview: false
      });
    }
    
    // Check if user has purchased this product
    const orders = readJSONFile('orders.json');
    const userPurchased = orders.some(order => 
      order.userId === req.session.user.id && 
      order.items && 
      order.items.some(item => item.productId === parseInt(productId))
    );
    
    res.json({
      success: true,
      loggedIn: true,
      canReview: userPurchased
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user status'
    });
  }
});

// GET reviews for a product
router.get('/product/:productId', function(req, res, next) {
  try {
    const { productId } = req.params;
    const reviews = readJSONFile('reviews.json');
    
    // Filter approved reviews for this product
    const productReviews = reviews.filter(r => 
      r.productId === parseInt(productId) && r.approved === true
    );
    
    // Calculate average rating and rating counts
    let totalRating = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    productReviews.forEach(review => {
      totalRating += review.rating;
      ratingCounts[review.rating]++;
    });
    
    const avgRating = productReviews.length > 0 
      ? (totalRating / productReviews.length)
      : 0;
    
    // Sort by date (newest first)
    productReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviews: productReviews,
      ratingCounts: ratingCounts
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// POST new review
router.post('/', function(req, res, next) {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to post a review'
      });
    }

    const { productId, rating, reviewText } = req.body;

    // Validate inputs
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required'
      });
    }

    if (reviewText.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 500 characters'
      });
    }

    // Check if user already reviewed this product
    const reviews = readJSONFile('reviews.json');
    const existingReview = reviews.find(r => 
      r.productId === parseInt(productId) && 
      r.userId === req.session.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Verify user has purchased this product
    const orders = readJSONFile('orders.json');
    const userOrder = orders.find(o => 
      o.userId === req.session.user.id && 
      o.items && o.items.some(item => item.productId === parseInt(productId)) &&
      o.status !== 'cancelled'
    );

    if (!userOrder) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    // Create new review
    const newReview = {
      id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id || 0)) + 1 : 1,
      productId: parseInt(productId),
      userId: req.session.user.id,
      userName: req.session.user.username || 'Anonymous',
      rating: parseInt(rating),
      reviewText: reviewText.trim(),
      approved: false, // Require admin approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reviews.push(newReview);

    if (writeJSONFile('reviews.json', reviews)) {
      res.json({
        success: true,
        message: 'Review submitted! It will appear after admin approval.',
        review: newReview
      });
    } else {
      throw new Error('Failed to save review');
    }
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

// PUT update review (only by reviewer or admin)
router.put('/:reviewId', function(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Please login to update a review'
      });
    }

    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const reviews = readJSONFile('reviews.json');
    const review = reviews.find(r => r.id === parseInt(reviewId));

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check authorization (owner or admin)
    if (review.userId !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
    }

    // Validate inputs
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    if (reviewText && reviewText.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'Review text cannot exceed 500 characters'
      });
    }

    // Update review
    if (rating) review.rating = parseInt(rating);
    if (reviewText !== undefined) review.reviewText = reviewText;
    review.updatedAt = new Date().toISOString();

    if (writeJSONFile('reviews.json', reviews)) {
      res.json({
        status: 'success',
        message: 'Review updated successfully',
        data: review
      });
    } else {
      throw new Error('Failed to update review');
    }
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update review'
    });
  }
});

// DELETE review (only by reviewer or admin)
router.delete('/:reviewId', function(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to delete a review'
      });
    }

    const { reviewId } = req.params;
    const reviews = readJSONFile('reviews.json');
    const review = reviews.find(r => r.id === parseInt(reviewId));

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization
    if (review.userId !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    // Remove review
    const updatedReviews = reviews.filter(r => r.id !== parseInt(reviewId));

    if (writeJSONFile('reviews.json', updatedReviews)) {
      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } else {
      throw new Error('Failed to delete review');
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// GET all reviews (admin only)
router.get('/admin/all', function(req, res, next) {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const reviews = readJSONFile('reviews.json');
    const products = readJSONFile('products.json');

    // Enrich reviews with product info
    const enrichedReviews = reviews.map(r => {
      const product = products.find(p => p.id === r.productId);
      return {
        ...r,
        productName: product ? product.name : 'Product Not Found'
      };
    });

    res.json({
      success: true,
      reviews: enrichedReviews,
      stats: {
        total: enrichedReviews.length,
        pending: enrichedReviews.filter(r => !r.approved && r.rejected !== true).length,
        approved: enrichedReviews.filter(r => r.approved === true).length,
        rejected: enrichedReviews.filter(r => r.rejected === true).length
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// PUT approve/reject review (admin only)
router.put('/admin/approve/:reviewId', function(req, res, next) {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { reviewId } = req.params;
    const { approved, rejected } = req.body;
    const reviews = readJSONFile('reviews.json');
    const review = reviews.find(r => r.id === parseInt(reviewId));

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (approved === true) {
      review.approved = true;
      review.rejected = false;
    } else if (rejected === true) {
      review.rejected = true;
      review.approved = false;
    }

    review.updatedAt = new Date().toISOString();

    if (writeJSONFile('reviews.json', reviews)) {
      res.json({
        success: true,
        message: approved ? 'Review approved' : (rejected ? 'Review rejected' : 'Review updated'),
        review: review
      });
    } else {
      throw new Error('Failed to update review approval');
    }
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review'
    });
  }
});

// DELETE admin review endpoint
router.delete('/admin/:reviewId', function(req, res, next) {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { reviewId } = req.params;
    const reviews = readJSONFile('reviews.json');
    const reviewIndex = reviews.findIndex(r => r.id === parseInt(reviewId));

    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    reviews.splice(reviewIndex, 1);

    if (writeJSONFile('reviews.json', reviews)) {
      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } else {
      throw new Error('Failed to delete review');
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

module.exports = router;
