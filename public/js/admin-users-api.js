// ===== EXAMPLE: Admin User Management API Integration =====
// Letakkan kode ini di file JavaScript yang diload di admin dashboard

class AdminUserAPI {
  constructor(baseUrl = '/api/users') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all users
   * @returns {Promise<Object>} List of users
   */
  async getAllUsers() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Users fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get single user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async deleteUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Updated user
   */
  async changePassword(userId, newPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Password changed:', data);
      return data;
    } catch (error) {
      console.error('❌ Error changing password:', error);
      throw error;
    }
  }
}

// ===== USAGE EXAMPLES =====

// Initialize API
const userAPI = new AdminUserAPI('/api/users');

// Example 1: Load all users
async function loadAllUsers() {
  try {
    const result = await userAPI.getAllUsers();
    console.table(result.data);
    
    // Update table
    updateUserTable(result.data);
  } catch (error) {
    alert('Failed to load users: ' + error.message);
  }
}

// Example 2: Update user role
async function changeUserRole(userId, newRole) {
  try {
    // First get current user data
    const userResult = await userAPI.getUser(userId);
    const user = userResult.data;
    
    // Update with new role
    const result = await userAPI.updateUser(userId, {
      username: user.username,
      email: user.email,
      role: newRole
    });
    
    alert(`✅ ${user.email} is now ${newRole}`);
    loadAllUsers(); // Refresh list
  } catch (error) {
    alert('❌ Failed to update user: ' + error.message);
  }
}

// Example 3: Delete user
async function removeUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      await userAPI.deleteUser(userId);
      alert('✅ User deleted successfully');
      loadAllUsers(); // Refresh list
    } catch (error) {
      alert('❌ Failed to delete user: ' + error.message);
    }
  }
}

// Example 4: Reset user password
async function resetUserPassword(userId) {
  const newPassword = prompt('Enter new password:');
  if (newPassword) {
    try {
      await userAPI.changePassword(userId, newPassword);
      alert('✅ Password reset successfully');
    } catch (error) {
      alert('❌ Failed to reset password: ' + error.message);
    }
  }
}

// Example 5: Update table with users
function updateUserTable(users) {
  const tableBody = document.querySelector('#usersTable tbody');
  tableBody.innerHTML = '';
  
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button onclick="changeUserRole('${user.id}', '${user.role === 'admin' ? 'customer' : 'admin'}')">
          ${user.role === 'admin' ? 'Demote' : 'Promote'}
        </button>
        <button onclick="resetUserPassword('${user.id}')">Reset Password</button>
        <button onclick="removeUser('${user.id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Load users on page load
document.addEventListener('DOMContentLoaded', loadAllUsers);
