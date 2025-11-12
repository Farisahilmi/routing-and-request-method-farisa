var express = require('express');
var router = express.Router();
const { readJSONFile, writeJSONFile, clearCache } = require('../helpers/database');
const { requireAuth } = require('../middleware/auth');

// GET All addresses for current user
router.get('/', requireAuth, function(req, res, next) {
  try {
    const addresses = readJSONFile('addresses.json');
    const userAddresses = addresses.filter(addr => addr.userId === req.session.user.id);
    
    res.render('addresses', {
      title: 'My Addresses - Simple Store',
      addresses: userAddresses,
      user: req.session.user
    });
  } catch (error) {
    console.error('❌ Error loading addresses:', error);
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
    
    // Validasi required fields
    if (!label || !fullName || !phone || !street || !city || !postalCode || !country) {
      return res.json({ 
        success: false, 
        message: 'Please fill all required fields' 
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
      label: label,
      fullName: fullName,
      phone: phone,
      street: street,
      city: city,
      state: state || '',
      postalCode: postalCode,
      country: country,
      isDefault: isDefault === 'true' || isDefault === true,
      createdAt: new Date().toISOString()
    };

    addresses.push(newAddress);
    
    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      res.json({ 
        success: true, 
        message: 'Address added successfully',
        address: newAddress
      });
    } else {
      res.json({ success: false, message: 'Failed to add address' });
    }
  } catch (error) {
    console.error('❌ Error adding address:', error);
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
    console.error('❌ Error loading address for edit:', error);
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
      return res.json({ success: false, message: 'Address not found' });
    }

    // Validasi required fields
    if (!label || !fullName || !phone || !street || !city || !postalCode || !country) {
      return res.json({ 
        success: false, 
        message: 'Please fill all required fields' 
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
      label: label,
      fullName: fullName,
      phone: phone,
      street: street,
      city: city,
      state: state || '',
      postalCode: postalCode,
      country: country,
      isDefault: isDefault === 'true' || isDefault === true,
      updatedAt: new Date().toISOString()
    };

    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      res.json({ 
        success: true, 
        message: 'Address updated successfully',
        address: addresses[addressIndex]
      });
    } else {
      res.json({ success: false, message: 'Failed to update address' });
    }
  } catch (error) {
    console.error('❌ Error updating address:', error);
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
      return res.json({ success: false, message: 'Address not found' });
    }

    const deletedAddress = addresses.splice(addressIndex, 1)[0];
    
    if (writeJSONFile('addresses.json', addresses)) {
      clearCache('addresses.json');
      res.json({ 
        success: true, 
        message: 'Address deleted successfully',
        deletedAddress: deletedAddress
      });
    } else {
      res.json({ success: false, message: 'Failed to delete address' });
    }
  } catch (error) {
    console.error('❌ Error deleting address:', error);
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
      res.json({ 
        success: true, 
        message: 'Default address updated successfully'
      });
    } else {
      res.json({ success: false, message: 'Failed to set default address' });
    }
  } catch (error) {
    console.error('❌ Error setting default address:', error);
    res.json({ success: false, message: 'Error setting default address' });
  }
});

module.exports = router;