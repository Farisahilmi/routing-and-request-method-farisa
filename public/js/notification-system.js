/**
 * Modern Notification System - Clean & Smooth UI
 * Provides toast and modal notifications with consistent styling
 */

class NotificationSystem {
    constructor() {
        this.toastContainer = document.getElementById('toastContainer');
        this.currentToasts = [];
    }

    /**
     * Show toast notification (appears at top-right, auto-dismisses)
     * @param {string} type - 'success', 'error', 'warning', 'info', 'loading'
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    toast(type, title, message, duration = 4000) {
        const toast = showToast(type, title, message, duration);
        this.currentToasts.push(toast);
        return toast;
    }

    /**
     * Show modal notification (center of screen, requires user action)
     * @param {string} type - 'success', 'error', 'warning', 'info', 'loading'
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} btnText - Button text (default: 'OK')
     */
    modal(type, title, message, btnText = 'OK') {
        showNotification(type, title, message, btnText);
    }

    /**
     * Show success notification
     */
    success(title, message, isModal = false) {
        if (isModal) {
            this.modal('success', title, message, 'Got it');
        } else {
            this.toast('success', title, message);
        }
    }

    /**
     * Show error notification
     */
    error(title, message, isModal = false) {
        if (isModal) {
            this.modal('error', title, message, 'Close');
        } else {
            this.toast('error', title, message, 0); // Don't auto-dismiss errors
        }
    }

    /**
     * Show warning notification
     */
    warning(title, message, isModal = false) {
        if (isModal) {
            this.modal('warning', title, message, 'Understand');
        } else {
            this.toast('warning', title, message, 5000);
        }
    }

    /**
     * Show info notification
     */
    info(title, message, isModal = false) {
        if (isModal) {
            this.modal('info', title, message);
        } else {
            this.toast('info', title, message);
        }
    }

    /**
     * Show loading notification
     */
    loading(title, message) {
        return this.toast('loading', title, message, 0); // Never auto-dismiss
    }

    /**
     * Clear all toasts
     */
    clearAll() {
        this.currentToasts.forEach(toast => {
            toast.style.animation = 'slideOutTop 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        });
        this.currentToasts = [];
    }

    /**
     * Update existing loading notification
     */
    updateLoading(loadingToast, type, title, message, duration = 3000) {
        if (loadingToast) {
            loadingToast.style.animation = 'slideOutTop 0.4s ease';
            setTimeout(() => {
                loadingToast.remove();
                this.toast(type, title, message, duration);
            }, 400);
        }
    }
}

// Global instance
const notify = new NotificationSystem();

/**
 * API Response Handler with Notifications
 */
function handleAPIResponse(response, loadingToast = null) {
    if (response.status === 'success') {
        if (loadingToast) {
            notify.updateLoading(loadingToast, 'success',
                'Success',
                response.message || 'Operation completed successfully'
            );
        } else {
            notify.success('Success', response.message || 'Operation completed');
        }
        return true;
    } else {
        if (loadingToast) {
            notify.updateLoading(loadingToast, 'error',
                'Error',
                response.message || 'Operation failed'
            );
        } else {
            notify.error('Error', response.message || 'Operation failed');
        }
        return false;
    }
}

/**
 * Example usage:
 *
 * // Show toast notification
 * notify.success('User Created', 'New user account created successfully');
 *
 * // Show loading notification
 * const loading = notify.loading('Processing', 'Creating user account...');
 *
 * // Update after API call
 * notify.updateLoading(loading, 'success', 'Done', 'User created!');
 *
 * // Show modal (requires user action to close)
 * notify.modal('success', 'Success', 'Operation completed!', 'Okay');
 *
 * // Handle API response
 * fetch('/api/users')
 *     .then(r => r.json())
 *     .then(data => handleAPIResponse(data, loadingToast));
 */
