var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');

// Import database helper dan logger untuk error tracking
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');
const logger = require('../helpers/logger');

// GET Cart Count (for navbar)
router.get('/count', function(req, res, next) {
  const cartItems = readJSONFile('cart.json');
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  res.json({ count: totalItems });
});

// GET Cart Page
router.get('/', function(req, res, next) {
  try {
    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    logger.debug(`Loading cart with ${cartItems.length} items`);

    // Enrich cart items with product details
    const enrichedCart = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        logger.warn(`Product not found for cart item: ${item.productId}`);
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
    }).filter(item => item.product);

    // Calculate total
    const total = enrichedCart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    logger.info(`Cart total: $${total}`);

    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: enrichedCart,
      total: total,
      user: req.session.user || null
    });
  } catch (error) {
    logger.error('Error loading cart page', error);
    res.render('cart', { 
      title: 'Shopping Cart',
      cartItems: [],
      total: 0,
      user: req.session.user || null
    });
  }
});

// POST Add to Cart
router.post('/add', function(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    
    logger.debug(`Add to cart request`, { productId, quantity });

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    // Check stock
    if (product.stock < parseInt(quantity)) {
      return res.json({ success: false, message: 'Not enough stock available' });
    }

    // Check if product already in cart
    const existingItem = cartItems.find(item => item.productId === parseInt(productId));
    
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + parseInt(quantity);
      if (newQuantity > product.stock) {
        return res.json({ success: false, message: 'Not enough stock available' });
      }
      existingItem.quantity = newQuantity;
    } else {
      // Add new item
      cartItems.push({
        id: cartItems.length > 0 ? Math.max(...cartItems.map(i => i.id)) + 1 : 1,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        addedAt: new Date().toISOString()
      });
    }

    if (writeJSONFile('cart.json', cartItems)) {
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      logger.success(`Product added to cart`, { productId, totalItems });
      res.json({ 
        success: true, 
        message: 'Product added to cart',
        cartCount: totalItems 
      });
    } else {
      res.json({ success: false, message: 'Failed to add to cart' });
    }
  } catch (error) {
    logger.error('Error adding to cart', error);
    res.json({ success: false, message: 'Error adding to cart' });
  }
});

// PUT Update Cart Item Quantity
router.put('/update/:id', function(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    logger.debug(`Update cart item`, { id, quantity });

    const cartItems = readJSONFile('cart.json');
    const item = cartItems.find(item => item.id === parseInt(id));
    
    if (!item) {
      return res.json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
      writeJSONFile('cart.json', updatedCart);
      logger.info(`Item removed from cart`, { id });
      return res.json({ 
        success: true, 
        message: 'Item removed from cart',
        cartCount: updatedCart.reduce((sum, item) => sum + item.quantity, 0)
      });
    }

    item.quantity = parseInt(quantity);
    
    if (writeJSONFile('cart.json', cartItems)) {
      logger.success(`Cart updated`, { id, newQuantity: quantity });
      res.json({ 
        success: true, 
        message: 'Cart updated',
        cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });
    } else {
      res.json({ success: false, message: 'Failed to update cart' });
    }
  } catch (error) {
    logger.error('Error updating cart', error);
    res.json({ success: false, message: 'Error updating cart' });
  }
});

// DELETE Remove from Cart
router.delete('/remove/:id', function(req, res, next) {
  try {
    const { id } = req.params;

    logger.debug(`Remove cart item`, { id });

    const cartItems = readJSONFile('cart.json');
    const updatedCart = cartItems.filter(item => item.id !== parseInt(id));
    
    if (writeJSONFile('cart.json', updatedCart)) {
      logger.success(`Item removed from cart`, { id });
      res.json({ 
        success: true, 
        message: 'Item removed from cart',
        cartCount: updatedCart.reduce((sum, item) => sum + item.quantity, 0)
      });
    } else {
      res.json({ success: false, message: 'Failed to remove item' });
    }
  } catch (error) {
    logger.error('Error removing from cart', error);
    res.json({ success: false, message: 'Error removing item from cart' });
  }
});

// POST Checkout - DENGAN STOCK ROLLBACK PROTECTION (2-Phase Commit)
router.post('/checkout', function(req, res, next) {
  try {
    // ✅ CEK USER LOGIN
    if (!req.session.user) {
      return res.json({ success: false, message: 'Please login to checkout' });
    }

    const { addressId, shippingAddress, paymentMethod } = req.body;
    
    // Validate required fields
    if (!paymentMethod) {
      return res.json({ success: false, message: 'Payment method is required' });
    }

    if (!addressId && !shippingAddress) {
      return res.json({ success: false, message: 'Shipping address is required' });
    }

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    const orders = readJSONFile('orders.json');
    
    logger.httpRequest('POST /checkout', { userId: req.session.user.id, itemsCount: cartItems.length });

    // ✅ Check if there are items to checkout (either cart items or buy-now item)
    if (cartItems.length === 0 && !req.session.buyNowItem) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    let finalShippingAddress = '';

    // ✅ PERBAIKAN: Handle address selection
    if (addressId && addressId !== 'new') {
      const addresses = readJSONFile('addresses.json');
      const selectedAddress = addresses.find(addr => 
        addr.id === parseInt(addressId) && addr.userId === req.session.user.id
      );
      
      if (!selectedAddress) {
        return res.json({ success: false, message: 'Selected address not found' });
      }

      finalShippingAddress = `${selectedAddress.label}\n${selectedAddress.fullName}\n${selectedAddress.phone}\n${selectedAddress.street}\n${selectedAddress.city}${selectedAddress.state ? ', ' + selectedAddress.state : ''} ${selectedAddress.postalCode}\n${selectedAddress.country}`;
    } else if (shippingAddress) {
      finalShippingAddress = shippingAddress;
    } else {
      return res.json({ success: false, message: 'Shipping address is required' });
    }

    // ✅ PHASE 1: VALIDATION - Check all constraints BEFORE making changes
    let totalAmount = 0;
    const orderItems = [];
    const originalStock = {}; // Store original stock for rollback
    
    // Determine items to process (buy-now or cart)
    let itemsToProcess = cartItems;
    if (req.session.buyNowItem) {
      const buyNowProduct = products.find(p => p.id === req.session.buyNowItem.productId);
      if (buyNowProduct) {
        itemsToProcess = [{
          productId: buyNowProduct.id,
          quantity: req.session.buyNowItem.quantity
        }];
      }
    }
    
    for (const cartItem of itemsToProcess) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        return res.json({ success: false, message: `Product ${cartItem.productId} not found` });
      }
      
      if (product.stock < cartItem.quantity) {
        return res.json({ 
          success: false, 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}` 
        });
      }
      
      // Store original stock for potential rollback
      originalStock[product.id] = product.stock;
      totalAmount += product.price * cartItem.quantity;
      orderItems.push({
        productId: cartItem.productId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image
      });
    }

    // ✅ PHASE 2: PREPARE - Generate order ID and prepare order object
    let newOrderId = 1;
    
    if (orders.length > 0) {
      const existingIds = orders.map(order => {
        const id = parseInt(order.id);
        return isNaN(id) ? 0 : id;
      }).filter(id => id > 0);
      
      if (existingIds.length > 0) {
        newOrderId = Math.max(...existingIds) + 1;
      } else {
        newOrderId = orders.length + 1;
      }
    }

    const newOrder = {
      id: newOrderId,
      userId: req.session.user.id,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: "pending",
      shippingAddress: finalShippingAddress,
      paymentMethod: paymentMethod || 'cash',
      createdAt: new Date().toISOString()
    };

    // ✅ PHASE 3: COMMIT - Update stock and save order
    try {
      // Determine items to process (buy-now or cart)
      let itemsToProcess = cartItems;
      if (req.session.buyNowItem) {
        const buyNowProduct = products.find(p => p.id === req.session.buyNowItem.productId);
        if (buyNowProduct) {
          itemsToProcess = [{
            productId: buyNowProduct.id,
            quantity: req.session.buyNowItem.quantity
          }];
        }
      }

      // Update product stock
      for (const cartItem of itemsToProcess) {
        const product = products.find(p => p.id === cartItem.productId);
        product.stock -= cartItem.quantity;
      }

      // Save updated products
      if (!writeJSONFile('products.json', products)) {
        throw new Error('Failed to update product stock');
      }
      
      // Add order to orders array
      orders.push(newOrder);
      
      // Save orders
      if (!writeJSONFile('orders.json', orders)) {
        // ROLLBACK: Restore original stock if order save fails
        for (const [productId, originalQty] of Object.entries(originalStock)) {
          const product = products.find(p => p.id === parseInt(productId));
          if (product) product.stock = originalQty;
        }
        writeJSONFile('products.json', products);
        throw new Error('Failed to create order - stock has been restored');
      }
      
      // Clear cache
      clearCache('orders.json');
      clearCache('products.json');
      
      // Clear cart or buy-now item
      if (req.session.buyNowItem) {
        delete req.session.buyNowItem;
      } else {
        writeJSONFile('cart.json', []);
      }

      logger.success(`Checkout successful! Order created`, { orderId: newOrder.id, userId: req.session.user.username });

      res.json({ 
        success: true, 
        message: 'Checkout successful! Order has been placed.',
        redirectUrl: `/cart/checkout/success?order_id=${newOrder.id}&total=${newOrder.totalAmount}`,
        orderId: newOrder.id,
        orderTotal: newOrder.totalAmount
      });
    } catch (commitError) {
      logger.error('Checkout commit failed', new Error(commitError.message));
      res.json({ success: false, message: commitError.message });
    }
  } catch (error) {
    logger.error('Checkout error', error);
    res.json({ success: false, message: 'Error during checkout process' });
  }
});
// GET Checkout Page - UPDATED dengan addresses
router.get('/checkout', function(req, res, next) {
  try {
    // ✅ CEK USER LOGIN
    if (!req.session.user) {
      return res.redirect('/users/login?message=Please login to checkout');
    }

    const cartItems = readJSONFile('cart.json');
    const products = readJSONFile('products.json');
    
    // ✅ Handle Buy Now Item - bypass cart.json
    let itemsToCheckout = [];
    let isBuyNow = false;

    if (req.session.buyNowItem) {
      // Buy Now flow - single product direct checkout
      const buyNowItem = req.session.buyNowItem;
      const product = products.find(p => p.id === buyNowItem.productId);
      
      if (!product || product.stock === 0) {
        delete req.session.buyNowItem;
        return res.redirect('/products?message=Product out of stock');
      }

      itemsToCheckout = [{
        productId: buyNowItem.productId,
        quantity: buyNowItem.quantity,
        product: product
      }];
      isBuyNow = true;

    } else if (cartItems.length > 0) {
      // Normal cart checkout
      itemsToCheckout = cartItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          product: product || { 
            name: 'Product Not Found', 
            price: 0
          }
        };
      });
    } else {
      return res.redirect('/cart?message=Your cart is empty');
    }

    // ✅ PERBAIKAN: Fetch addresses untuk user
    const addresses = readJSONFile('addresses.json');
    const userAddresses = addresses.filter(addr => addr.userId === req.session.user.id);
    const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];

    // Calculate total
    const totalAmount = itemsToCheckout.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.render('checkout', {
      title: 'Checkout',
      cartItems: itemsToCheckout,
      totalAmount: totalAmount,
      addresses: userAddresses,
      defaultAddress: defaultAddress,
      user: req.session.user,
      isBuyNow: isBuyNow
    });
  } catch (error) {
    logger.error('Error loading checkout page', error);
    res.redirect('/cart?message=Error loading checkout page');
  }
});
// GET Checkout Success Page - DENGAN PERLINDUNGAN VALIDASI
router.get('/checkout/success', function(req, res, next) {
  const { order_id, total } = req.query;
  
  logger.info(`Checkout success page accessed`, { order_id, total });

  // ✅ PERBAIKAN: Pastikan order_id dan total ada
  if (!order_id || !total) {
    logger.warn(`Missing order parameters in checkout success`);
    return res.redirect('/cart?message=Invalid order confirmation');
  }

  // ✅ Optional: Validate order exists (prevent order ID guessing)
  try {
    const orders = readJSONFile('orders.json');
    const order = orders.find(o => o.id === parseInt(order_id));
    if (!order) {
      logger.warn(`Order not found for ID: ${order_id}`);
      return res.redirect('/cart?message=Order not found');
    }
  } catch (error) {
    logger.error('Error validating order in success page', error);
  }

  res.render('checkout-success', { 
    title: 'Order Confirmed - Simple Store',
    orderId: order_id,
    orderTotal: total,
    user: req.session.user || null
  });
});

// CLEAR entire cart
router.delete('/clear', function(req, res, next) {
  try {
    writeJSONFile('cart.json', []);
    
    logger.success('Cart cleared');
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing cart', error);
    res.json({ success: false, message: 'Error clearing cart' });
  }
});

// RESET ORDERS (Admin only) - NEW
router.post('/reset-orders', function(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.json({ 
      success: false, 
      message: 'Admin access required to reset orders' 
    });
  }

  try {
    // Reset orders to empty array
    if (writeJSONFile('orders.json', [])) {
      // Clear cache setelah reset orders
      clearCache('orders.json');
      logger.success('Orders reset by admin');
      res.json({ 
        success: true, 
        message: 'Orders reset successfully. Next order will start from ID 1.' 
      });
    } else {
      res.json({ success: false, message: 'Failed to reset orders' });
    }
  } catch (error) {
    logger.error('Reset orders error', error);
    res.json({ success: false, message: 'Error resetting orders' });
  }
});

module.exports = router;