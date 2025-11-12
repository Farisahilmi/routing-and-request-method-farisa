/**
 * Centralized ID Generation Helper
 * Ensures consistent ID generation across the entire application
 */

/**
 * Generate next ID for array of objects
 * @param {Array} dataArray - Array of objects with id property
 * @param {String} format - 'number' or 'string' (default: 'number')
 * @returns {Number|String} Next ID
 */
const generateId = (dataArray = [], format = 'number') => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return format === 'string' ? '1' : 1;
  }

  try {
    // Filter out non-numeric IDs and parse them
    const numericIds = dataArray
      .map(item => {
        const id = parseInt(item.id, 10);
        return isNaN(id) ? 0 : id;
      })
      .filter(id => id > 0);

    // If no valid numeric IDs found, start from 1
    if (numericIds.length === 0) {
      return format === 'string' ? '1' : 1;
    }

    const nextId = Math.max(...numericIds) + 1;
    return format === 'string' ? String(nextId) : nextId;
  } catch (error) {
    console.error('Error generating ID:', error);
    return format === 'string' ? '1' : 1;
  }
};

/**
 * Generate UUID-like string ID
 * Format: TIMESTAMP-RANDOMHASH
 * @returns {String} Unique ID
 */
const generateUUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate timestamped numeric ID
 * Useful for distributed systems
 * @returns {Number} Timestamp-based ID
 */
const generateTimestampId = () => {
  return Date.now();
};

module.exports = {
  generateId,
  generateUUID,
  generateTimestampId
};
