var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');
const { requireAuth } = require('../middleware/auth');
const { validateAddress, validatePhone, sanitizeString } = require('../helpers/validator');
const logger = require('../helpers/logger');

// GET All addresses for current user
router.get('/', requireAuth, function(req, res, next) {
  try {
    const addresses = readJSONFile('addresses.json');
    const userAddresses = addresses.filter(addr => addr.userId === req.session.user.id);
    
    logger.info(`Addresses loaded`, { userId: req.session.user.id, count: userAddresses.length });
    
    res.render('addresses', {
      title: 'My Addresses - Simple Store',
      addresses: userAddresses,
      user: req.session.user
    });
  } catch (error) {
    logger.error('Error loading addresses', error);
    res.render('addresses', {
      title: 'My Addresses - Simple Store',
      addresses: [],
      user: req.session.user
    });
  }
});

// GET Add new address form
router.get('/add', requireAuth, function(req, res, next) {
  res.render('address-form', {
    title: 'Add New Address - Simple Store',
    address: null,
    user: req.session.user
  });
});

// POST Create new address
router.post('/add', requireAuth, function(req, res, next) {
  try {
    const { label, fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;
    
    const addresses = readJSONFile('addresses.json');
    
    // ✅ VALIDATION: Check required fields
    if (!label || !fullName || !phone || !street || !city || !postalCode || !country) {
      logger.warn('Address: Missing required fields');
      return res.json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }

    // ✅ VALIDATION: Phone number format
    if (!validatePhone(phone)) {
      logger.warn(`Address: Invalid phone format - ${phone}`);
      return res.json({ 
        success: false, 
        message: 'Invalid phone number format' 
      });
    }

    // ✅ VALIDATION: Address fields
    const addressError = validateAddress({ label, fullName, street, city, postalCode, country });
    if (addressError) {
      logger.warn(`Address: Validation error - ${addressError}`);
      return res.json({ 
        success: false, 
        message: addressError
      });
    }

    // Generate new ID
    const newId = addresses.length > 0 ? Math.max(...addresses.map(a => a.id)) + 1 : 1;

    // Jika set as default, reset semua default addresses user ini
    if (isDefault === 'true' || isDefault === true) {
      addresses.forEach(addr => {
        if (addr.userId === req.session.user.id) {
          addr.isDefault = false;
        }
      });
    }

    const newAddress = {
      id: newId,
      userId: req.session.user.id,
      label: sanitizeString(label),
      fullName: sanitizeString(fullName),
      phone: phone,
      street: sanitizeString(street),
      city: sanitizeString(city),
      state: sanitizeString(state || ''),
      postalCode: sanitizeString(postalCode),
      country: sanitizeString(country),
      isDefault: isDefault === 'true' || isDefault === true,
      createdAt: new Date().toISOString()
    };

    addresses.push(newAddress);
    
    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      logger.success(`Address added`, { userId: req.session.user.id, addressId: newId });
      res.json({ 
        success: true, 
        message: 'Address added successfully',
        address: newAddress
      });
    } else {
      logger.error('Failed to write addresses.json');
      res.json({ success: false, message: 'Failed to add address' });
    }
  } catch (error) {
    logger.error('Error adding address', error);
    res.json({ success: false, message: 'Error adding address' });
  }
});

// GET Edit address form
router.get('/edit/:id', requireAuth, function(req, res, next) {
  try {
    const addressId = parseInt(req.params.id);
    const addresses = readJSONFile('addresses.json');
    
    const address = addresses.find(addr => 
      addr.id === addressId && addr.userId === req.session.user.id
    );
    
    if (!address) {
      logger.warn(`Address: Not found for edit - ${addressId}`);
      return res.status(404).render('error', {
        message: 'Address not found',
        user: req.session.user
      });
    }

    res.render('address-form', {
      title: 'Edit Address - Simple Store',
      address: address,
      user: req.session.user
    });
  } catch (error) {
    logger.error('Error loading address for edit', error);
    res.status(500).render('error', {
      message: 'Error loading address',
      user: req.session.user
    });
  }
});

// PUT Update address
router.put('/edit/:id', requireAuth, function(req, res, next) {
  try {
    const addressId = parseInt(req.params.id);
    const { label, fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;
    
    const addresses = readJSONFile('addresses.json');
    const addressIndex = addresses.findIndex(addr => 
      addr.id === addressId && addr.userId === req.session.user.id
    );
    
    if (addressIndex === -1) {
      logger.warn(`Address: Address not found - ${addressId}`);
      return res.json({ success: false, message: 'Address not found' });
    }

    // ✅ VALIDATION: Check required fields
    if (!label || !fullName || !phone || !street || !city || !postalCode || !country) {
      logger.warn('Address: Missing required fields for update');
      return res.json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }

    // ✅ VALIDATION: Phone number format
    if (!validatePhone(phone)) {
      logger.warn(`Address: Invalid phone format - ${phone}`);
      return res.json({ 
        success: false, 
        message: 'Invalid phone number format' 
      });
    }

    // ✅ VALIDATION: Address fields
    const addressError = validateAddress({ label, fullName, street, city, postalCode, country });
    if (addressError) {
      logger.warn(`Address: Validation error - ${addressError}`);
      return res.json({ 
        success: false, 
        message: addressError
      });
    }

    // Jika set as default, reset semua default addresses user ini
    if (isDefault === 'true' || isDefault === true) {
      addresses.forEach(addr => {
        if (addr.userId === req.session.user.id && addr.id !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      label: sanitizeString(label),
      fullName: sanitizeString(fullName),
      phone: phone,
      street: sanitizeString(street),
      city: sanitizeString(city),
      state: sanitizeString(state || ''),
      postalCode: sanitizeString(postalCode),
      country: sanitizeString(country),
      isDefault: isDefault === 'true' || isDefault === true,
      updatedAt: new Date().toISOString()
    };

    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      logger.success(`Address updated`, { userId: req.session.user.id, addressId });
      res.json({ 
        success: true, 
        message: 'Address updated successfully',
        address: addresses[addressIndex]
      });
    } else {
      logger.error('Failed to write addresses.json');
      res.json({ success: false, message: 'Failed to update address' });
    }
  } catch (error) {
    logger.error('Error updating address', error);
    res.json({ success: false, message: 'Error updating address' });
  }
});

// DELETE Address
router.delete('/delete/:id', requireAuth, function(req, res, next) {
  try {
    const addressId = parseInt(req.params.id);
    const addresses = readJSONFile('addresses.json');
    
    const addressIndex = addresses.findIndex(addr => 
      addr.id === addressId && addr.userId === req.session.user.id
    );
    
    if (addressIndex === -1) {
      logger.warn(`Address: Delete failed - address not found - ${addressId}`);
      return res.json({ success: false, message: 'Address not found' });
    }

    const deletedAddress = addresses.splice(addressIndex, 1)[0];
    
    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      logger.success(`Address deleted`, { userId: req.session.user.id, addressId });
      res.json({ 
        success: true, 
        message: 'Address deleted successfully',
        deletedAddress: deletedAddress
      });
    } else {
      logger.error('Failed to write addresses.json');
      res.json({ success: false, message: 'Failed to delete address' });
    }
  } catch (error) {
    logger.error('Error deleting address', error);
    res.json({ success: false, message: 'Error deleting address' });
  }
});

// SET Default Address
router.put('/set-default/:id', requireAuth, function(req, res, next) {
  try {
    const addressId = parseInt(req.params.id);
    const addresses = readJSONFile('addresses.json');
    
    // Reset semua default addresses user ini
    addresses.forEach(addr => {
      if (addr.userId === req.session.user.id) {
        addr.isDefault = addr.id === addressId;
      }
    });

    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      logger.success(`Default address set`, { userId: req.session.user.id, addressId });
      res.json({ 
        success: true, 
        message: 'Default address updated successfully'
      });
    } else {
      logger.error('Failed to write addresses.json');
      res.json({ success: false, message: 'Failed to set default address' });
    }
  } catch (error) {
    logger.error('Error setting default address', error);
    res.json({ success: false, message: 'Error setting default address' });
  }
});

module.exports = router;