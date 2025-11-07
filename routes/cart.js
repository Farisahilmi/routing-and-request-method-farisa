var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

function readJSONFile(filename) {
  const filePath = path.join(__dirname, '../data', filename);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(__dirname, '../data', filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ ${filename} saved successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error.message);
    return false;
  }
}

// GET Cart Count (for navbar)
router.get('/count', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    console.log(`📊 Cart count: ${totalItems} items`);
    res.json({ count: totalItems });
  } catch (error) {
    console.error('❌ Error getting cart count:', error);
    res.json({ count: 0 });
  }
});

// GET Cart Page
router.get('/', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    console.log(`🛒 Loading cart page with ${cartItems.length} items`);

    // Enrich cart items with product details
    const enrichedCart = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        console.log(`❌ Product not found for cart item: ${item.productId}`);
      }
      return {
        ...item,
        product: product || { 
          id: item.productId,
          name: 'Product Not Found', 
          price: 0, 
          image: '/images/default.jpg',
          stock: 0
        }
      };
    }).filter(item => item.product); // Remove items with invalid products

    // Calculate total
    const total = enrichedCart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    console.log(`💰 Cart total: $${total}`);

    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: enrichedCart,
      total: total
    });
  } catch (error) {
    console.error('❌ Error loading cart page:', error);
    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: [],
      total: 0
    });
  }
});

// POST Add to Cart
router.post('/add', function(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    
    console.log(`🛒 Add to cart request:`, { productId, quantity });

    if (!productId) {
      return res.json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check stock
    if (product.stock < parseInt(quantity)) {
      return res.json({ 
        success: false, 
        message: 'Not enough stock available' 
      });
    }

    // Check if product already in cart
    const existingItemIndex = cartItems.findIndex(item => item.productId === parseInt(productId));
    
    if (existingItemIndex !== -1) {
      // Update quantity
      cartItems[existingItemIndex].quantity += parseInt(quantity);
      console.log(`✅ Updated existing item: ${product.name}, new quantity: ${cartItems[existingItemIndex].quantity}`);
    } else {
      // Add new item
      const newId = cartItems.length > 0 ? Math.max(...cartItems.map(i => i.id)) + 1 : 1;
      const newItem = {
        id: newId,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        addedAt: new Date().toISOString()
      };
      cartItems.push(newItem);
      console.log(`✅ Added new item: ${product.name}, quantity: ${quantity}`);
    }

    // Save to file
    if (writeJSONFile('cart.json', cartItems)) {
      const updatedCart = readJSONFile('cart.json');
      const totalItems = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
      
      res.json({ 
        success: true, 
        message: 'Product added to cart successfully',
        cartCount: totalItems
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Failed to save cart' 
      });
    }
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    res.json({ 
      success: false, 
      message: 'Error adding to cart: ' + error.message 
    });
  }
});

// PUT Update Cart Item Quantity
router.put('/update/:id', function(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log(`✏️ Update cart item:`, { id, quantity });

    const cartItems = readJSONFile('cart.json');
    const itemIndex = cartItems.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const removedItem = cartItems.splice(itemIndex, 1)[0];
      console.log(`🗑️ Removed item from cart: ${removedItem.productId}`);
    } else {
      // Update quantity
      cartItems[itemIndex].quantity = parseInt(quantity);
      console.log(`✅ Updated item quantity: ${cartItems[itemIndex].productId} to ${quantity}`);
    }

    if (writeJSONFile('cart.json', cartItems)) {
      res.json({ 
        success: true, 
        message: 'Cart updated successfully' 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Failed to update cart' 
      });
    }
  } catch (error) {
    console.error('❌ Update cart error:', error);
    res.json({ 
      success: false, 
      message: 'Error updating cart: ' + error.message 
    });
  }
});

// DELETE Remove from Cart
router.delete('/remove/:id', function(req, res, next) {
  try {
    const { id } = req.params;

    console.log(`🗑️ Remove from cart request:`, { id });

    const cartItems = readJSONFile('cart.json');
    const itemIndex = cartItems.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.json({ 
        success: false, 
        message: 'Item not found in cart' 
      });
    }

    const removedItem = cartItems.splice(itemIndex, 1)[0];
    console.log(`✅ Removed item: ${removedItem.productId}`);

    if (writeJSONFile('cart.json', cartItems)) {
      res.json({ 
        success: true, 
        message: 'Item removed from cart successfully' 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Failed to remove item from cart' 
      });
    }
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    res.json({ 
      success: false, 
      message: 'Error removing item from cart: ' + error.message 
    });
  }
});

// POST Checkout
router.post('/checkout', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    const orders = readJSONFile('orders.json');
    const users = readJSONFile('users.json');
    
    console.log(`💰 Checkout request with ${cartItems.length} items`);

    if (cartItems.length === 0) {
      return res.json({ 
        success: false, 
        message: 'Cart is empty' 
      });
    }

    // Calculate total and prepare order items
    let orderTotal = 0;
    const orderProducts = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = product ? product.price * item.quantity : 0;
      orderTotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product ? product.price : 0,
        productName: product ? product.name : 'Unknown Product'
      };
    });

    // Generate new order ID
    const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;

    // Create new order
    const newOrder = {
      id: newOrderId,
      userId: "2", // Default user ID (John Customer)
      products: orderProducts,
      totalAmount: orderTotal,
      status: "processing",
      shippingAddress: "123 Main St, Jakarta, Indonesia",
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Creating new order #${newOrderId} with total: $${orderTotal}`);

    // Add to orders
    orders.push(newOrder);
    
    // Save orders and clear cart
    if (writeJSONFile('orders.json', orders) && writeJSONFile('cart.json', [])) {
      console.log(`🎉 Checkout successful! Order #${newOrderId} created`);
      
      res.json({ 
        success: true, 
        message: 'Checkout successful! Order has been placed.',
        orderId: newOrderId,
        orderTotal: orderTotal
      });
    } else {
      console.log(`❌ Failed to save order or clear cart`);
      res.json({ 
        success: false, 
        message: 'Failed to process checkout' 
      });
    }
  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.json({ 
      success: false, 
      message: 'Error during checkout: ' + error.message 
    });
  }
});

module.exports = router;