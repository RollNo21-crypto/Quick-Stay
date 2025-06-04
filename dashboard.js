// Dashboard related functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = 'auth.html';
        return;
    }

    // Initialize dashboard components
    initializeDashboard();

    // Load user data
    loadUserProfile();

    // Load user bookings
    loadUserBookings();
});

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return !!(token && user._id);
}

/**
 * Initialize dashboard components and event listeners
 */
function initializeDashboard() {
    // Set username in the header
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && user.name) {
        usernameDisplay.textContent = user.name;
    }

    // Initialize logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Initialize tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Initialize booking status filter
    const statusFilter = document.getElementById('booking-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadUserBookings(this.value);
        });
    }

    // Initialize profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateUserProfile();
        });
    }

    // Initialize password change form
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

/**
 * Load user profile data
 */
async function loadUserProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) return;

        // Get latest user data from server
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${user._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user profile');
        }

        const userData = await response.json();

        // Update form fields
        document.getElementById('profile-name').value = userData.name || '';
        document.getElementById('profile-email').value = userData.email || '';
        document.getElementById('profile-phone').value = userData.phone || '';
        document.getElementById('profile-address').value = userData.address || '';

    } catch (error) {
        console.error('Error loading profile:', error);
        showDashboardMessage('Failed to load profile data. Please try again.', 'error');
    }
}

/**
 * Update user profile
 */
async function updateUserProfile() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) return;

        const name = document.getElementById('profile-name').value;
        const phone = document.getElementById('profile-phone').value;
        const address = document.getElementById('profile-address').value;

        // Basic validation
        if (!name || !phone) {
            showDashboardMessage('Please fill in all required fields', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${user._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                email: user.email, // Email cannot be changed
                phone,
                address
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();

        // Update local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
            ...currentUser,
            name: updatedUser.name
        }));

        // Update username display
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = updatedUser.name;
        }

        showDashboardMessage('Profile updated successfully', 'success');

    } catch (error) {
        console.error('Error updating profile:', error);
        showDashboardMessage('Failed to update profile. Please try again.', 'error');
    }
}

/**
 * Change user password
 */
async function changePassword() {
    try {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showDashboardMessage('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showDashboardMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showDashboardMessage('Password must be at least 6 characters', 'error');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');

        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: user._id,
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to change password');
        }

        // Clear form
        document.getElementById('change-password-form').reset();

        showDashboardMessage('Password changed successfully', 'success');

    } catch (error) {
        console.error('Error changing password:', error);
        showDashboardMessage(error.message || 'Failed to change password. Please try again.', 'error');
    }
}

/**
 * Load user bookings
 */
async function loadUserBookings(status = 'all') {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) return;

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/user/${user._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const bookings = await response.json();
        displayUserBookings(bookings, status);

    } catch (error) {
        console.error('Error loading bookings:', error);
        showDashboardMessage('Failed to load bookings. Please try again.', 'error');
    }
}

/**
 * Display user bookings
 */
function displayUserBookings(bookings, filterStatus) {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;

    // Filter bookings based on status
    let filteredBookings = bookings;
    const today = new Date();

    if (filterStatus === 'upcoming') {
        filteredBookings = bookings.filter(booking => 
            new Date(booking.checkIn) > today && booking.status !== 'cancelled'
        );
    } else if (filterStatus === 'past') {
        filteredBookings = bookings.filter(booking => 
            new Date(booking.checkOut) < today || booking.status === 'completed'
        );
    } else if (filterStatus === 'cancelled') {
        filteredBookings = bookings.filter(booking => booking.status === 'cancelled');
    }

    // Display message if no bookings
    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <p>No ${filterStatus !== 'all' ? filterStatus : ''} bookings found.</p>
            </div>
        `;
        return;
    }

    // Display bookings
    bookingsList.innerHTML = filteredBookings.map(booking => {
        const checkInDate = new Date(booking.checkIn).toLocaleDateString();
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
        const room = booking.room;
        
        // Calculate status class for styling
        let statusClass = '';
        switch(booking.status) {
            case 'confirmed': statusClass = 'status-confirmed'; break;
            case 'pending': statusClass = 'status-pending'; break;
            case 'cancelled': statusClass = 'status-cancelled'; break;
            case 'completed': statusClass = 'status-completed'; break;
        }

        return `
            <div class="booking-card" data-booking-id="${booking._id}">
                <div class="booking-image">
                    <img src="${room.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}" alt="${room.name}">
                </div>
                <div class="booking-details">
                    <h3>${room.name}</h3>
                    <p class="booking-dates">
                        <span class="check-in"><i class="fas fa-calendar-check"></i> Check-in: ${checkInDate}</span>
                        <span class="check-out"><i class="fas fa-calendar-times"></i> Check-out: ${checkOutDate}</span>
                    </p>
                    <p class="booking-guests"><i class="fas fa-users"></i> Guests: ${booking.guests}</p>
                    <p class="booking-price"><i class="fas fa-tag"></i> Total: $${booking.totalPrice}</p>
                    <div class="booking-status ${statusClass}">
                        <span>Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                    </div>
                </div>
                <div class="booking-actions">
                    ${booking.status === 'pending' || booking.status === 'confirmed' ? 
                        `<button class="btn-small cancel-booking" data-booking-id="${booking._id}">Cancel</button>` : ''}
                    <button class="btn-small view-booking" data-booking-id="${booking._id}">View Details</button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to booking action buttons
    document.querySelectorAll('.cancel-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            cancelBooking(bookingId);
        });
    });

    document.querySelectorAll('.view-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            viewBookingDetails(bookingId);
        });
    });
}

/**
 * Cancel a booking
 */
async function cancelBooking(bookingId) {
    try {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel booking');
        }

        showDashboardMessage('Booking cancelled successfully', 'success');
        
        // Reload bookings
        loadUserBookings(document.getElementById('booking-status-filter').value);

    } catch (error) {
        console.error('Error cancelling booking:', error);
        showDashboardMessage('Failed to cancel booking. Please try again.', 'error');
    }
}

/**
 * View booking details
 */
function viewBookingDetails(bookingId) {
    // In a real application, you would fetch the booking details and display them in a modal
    alert(`Viewing details for booking ${bookingId}`);
}

/**
 * Display dashboard messages
 */
function showDashboardMessage(message, type = 'info') {
    // Check if message container exists, if not create it
    let messageContainer = document.querySelector('.dashboard-message');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'dashboard-message';
        const dashboardContent = document.querySelector('.dashboard-content');
        if (dashboardContent) {
            dashboardContent.prepend(messageContainer);
        }
    }

    // Set message content and style
    messageContainer.textContent = message;
    messageContainer.className = `dashboard-message ${type}`;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            messageContainer.remove();
        }, 500);
    }, 5000);
}