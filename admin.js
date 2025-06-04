// Admin panel functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is an admin
    if (!isAdmin()) {
        window.location.href = 'auth.html';
        return;
    }

    // Initialize admin panel components
    initializeAdminPanel();

    // Load rooms
    loadRooms();

    // Load bookings
    loadBookings();

    // Load users
    loadUsers();
});

/**
 * Check if user is authenticated and is an admin
 */
function isAdmin() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return !!(token && user._id && user.role === 'admin');
}

/**
 * Initialize admin panel components and event listeners
 */
function initializeAdminPanel() {
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

    // Initialize room filters
    const roomTypeFilter = document.getElementById('room-type-filter');
    const roomAvailabilityFilter = document.getElementById('room-availability-filter');
    
    if (roomTypeFilter && roomAvailabilityFilter) {
        roomTypeFilter.addEventListener('change', function() {
            filterRooms();
        });
        
        roomAvailabilityFilter.addEventListener('change', function() {
            filterRooms();
        });
    }

    // Initialize booking filters
    const bookingStatusFilter = document.getElementById('admin-booking-status-filter');
    const bookingDateFilter = document.getElementById('booking-date-filter');
    
    if (bookingStatusFilter && bookingDateFilter) {
        bookingStatusFilter.addEventListener('change', function() {
            filterBookings();
        });
        
        bookingDateFilter.addEventListener('change', function() {
            filterBookings();
        });
    }

    // Initialize add room button
    const addRoomBtn = document.getElementById('add-room-btn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', function() {
            showRoomModal();
        });
    }
}

/**
 * Load all rooms
 */
async function loadRooms() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/rooms', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load rooms');
        }

        const rooms = await response.json();
        displayRooms(rooms);

    } catch (error) {
        console.error('Error loading rooms:', error);
        showAdminMessage('Failed to load rooms. Please try again.', 'error');
    }
}

/**
 * Display rooms in the admin panel
 */
function displayRooms(rooms) {
    const roomsList = document.getElementById('admin-rooms-list');
    if (!roomsList) return;

    if (rooms.length === 0) {
        roomsList.innerHTML = `
            <div class="no-rooms">
                <p>No rooms found.</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = rooms.map(room => {
        return `
            <div class="room-card" data-room-id="${room._id}" data-room-type="${room.type}" data-room-available="${room.available}">
                <div class="room-image">
                    <img src="${room.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}" alt="${room.name}">
                </div>
                <div class="room-details">
                    <h3>${room.name}</h3>
                    <p class="room-type">Type: ${room.type.charAt(0).toUpperCase() + room.type.slice(1)}</p>
                    <p class="room-price">Price: $${room.price} / night</p>
                    <p class="room-capacity">Capacity: ${room.capacity} guests</p>
                    <div class="room-status ${room.available ? 'status-available' : 'status-unavailable'}">
                        <span>Status: ${room.available ? 'Available' : 'Unavailable'}</span>
                    </div>
                </div>
                <div class="room-actions">
                    <button class="btn-small edit-room" data-room-id="${room._id}">Edit</button>
                    <button class="btn-small toggle-availability" data-room-id="${room._id}" data-available="${room.available}">
                        ${room.available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to room action buttons
    document.querySelectorAll('.edit-room').forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            editRoom(roomId);
        });
    });

    document.querySelectorAll('.toggle-availability').forEach(button => {
        button.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            const currentlyAvailable = this.getAttribute('data-available') === 'true';
            toggleRoomAvailability(roomId, !currentlyAvailable);
        });
    });
}

/**
 * Filter rooms based on selected filters
 */
function filterRooms() {
    const typeFilter = document.getElementById('room-type-filter').value;
    const availabilityFilter = document.getElementById('room-availability-filter').value;
    
    const roomCards = document.querySelectorAll('.room-card');
    
    roomCards.forEach(card => {
        const roomType = card.getAttribute('data-room-type');
        const roomAvailable = card.getAttribute('data-room-available') === 'true';
        
        let showCard = true;
        
        // Apply type filter
        if (typeFilter !== 'all' && roomType !== typeFilter) {
            showCard = false;
        }
        
        // Apply availability filter
        if (availabilityFilter !== 'all') {
            if (availabilityFilter === 'available' && !roomAvailable) {
                showCard = false;
            } else if (availabilityFilter === 'unavailable' && roomAvailable) {
                showCard = false;
            }
        }
        
        card.style.display = showCard ? 'flex' : 'none';
    });
}

/**
 * Show room modal for adding or editing a room
 */
function showRoomModal(roomData = null) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('room-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'room-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>${roomData ? 'Edit Room' : 'Add New Room'}</h2>
                <form id="room-form">
                    <div class="form-group">
                        <label for="room-name">Room Name</label>
                        <input type="text" id="room-name" required>
                    </div>
                    <div class="form-group">
                        <label for="room-type">Room Type</label>
                        <select id="room-type" required>
                            <option value="standard">Standard Room</option>
                            <option value="deluxe">Deluxe Room</option>
                            <option value="suite">Suite</option>
                            <option value="presidential">Presidential Suite</option>
                            <option value="family">Family Room</option>
                            <option value="business">Business Room</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="room-price">Price per Night ($)</label>
                        <input type="number" id="room-price" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="room-capacity">Capacity (Guests)</label>
                        <input type="number" id="room-capacity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="room-description">Description</label>
                        <textarea id="room-description" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="room-amenities">Amenities (comma separated)</label>
                        <input type="text" id="room-amenities" required>
                    </div>
                    <div class="form-group">
                        <label for="room-image">Image URL</label>
                        <input type="text" id="room-image" required>
                    </div>
                    <div class="form-group">
                        <label for="room-location">Location</label>
                        <input type="text" id="room-location" required>
                    </div>
                    <div class="form-group">
                        <label for="room-available">Availability</label>
                        <select id="room-available" required>
                            <option value="true">Available</option>
                            <option value="false">Unavailable</option>
                        </select>
                    </div>
                    <input type="hidden" id="room-id">
                    <button type="submit" class="btn btn-primary">${roomData ? 'Update Room' : 'Add Room'}</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener to close button
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Add event listener to form submission
        const roomForm = document.getElementById('room-form');
        roomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveRoom();
        });
    }
    
    // Fill form with room data if editing
    if (roomData) {
        document.getElementById('room-id').value = roomData._id;
        document.getElementById('room-name').value = roomData.name;
        document.getElementById('room-type').value = roomData.type;
        document.getElementById('room-price').value = roomData.price;
        document.getElementById('room-capacity').value = roomData.capacity;
        document.getElementById('room-description').value = roomData.description;
        document.getElementById('room-amenities').value = roomData.amenities.join(', ');
        document.getElementById('room-image').value = roomData.images[0] || '';
        document.getElementById('room-location').value = roomData.location;
        document.getElementById('room-available').value = roomData.available.toString();
    } else {
        // Reset form if adding new room
        document.getElementById('room-form').reset();
        document.getElementById('room-id').value = '';
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Save room (add new or update existing)
 */
async function saveRoom() {
    try {
        const roomId = document.getElementById('room-id').value;
        const name = document.getElementById('room-name').value;
        const type = document.getElementById('room-type').value;
        const price = parseFloat(document.getElementById('room-price').value);
        const capacity = parseInt(document.getElementById('room-capacity').value);
        const description = document.getElementById('room-description').value;
        const amenitiesString = document.getElementById('room-amenities').value;
        const imageUrl = document.getElementById('room-image').value;
        const location = document.getElementById('room-location').value;
        const available = document.getElementById('room-available').value === 'true';
        
        // Basic validation
        if (!name || !type || !price || !capacity || !description || !amenitiesString || !imageUrl || !location) {
            showAdminMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Parse amenities
        const amenities = amenitiesString.split(',').map(item => item.trim()).filter(item => item);
        
        // Prepare room data
        const roomData = {
            name,
            type,
            price,
            capacity,
            description,
            amenities,
            images: [imageUrl],
            location,
            available
        };
        
        const token = localStorage.getItem('token');
        let response;
        
        if (roomId) {
            // Update existing room
            response = await fetch(`/api/rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(roomData)
            });
        } else {
            // Create new room
            response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(roomData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save room');
        }
        
        // Close modal
        document.getElementById('room-modal').style.display = 'none';
        
        // Show success message
        showAdminMessage(`Room ${roomId ? 'updated' : 'added'} successfully`, 'success');
        
        // Reload rooms
        loadRooms();
        
    } catch (error) {
        console.error('Error saving room:', error);
        showAdminMessage('Failed to save room. Please try again.', 'error');
    }
}

/**
 * Edit a room
 */
async function editRoom(roomId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/rooms/${roomId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load room details');
        }
        
        const roomData = await response.json();
        showRoomModal(roomData);
        
    } catch (error) {
        console.error('Error loading room details:', error);
        showAdminMessage('Failed to load room details. Please try again.', 'error');
    }
}

/**
 * Toggle room availability
 */
async function toggleRoomAvailability(roomId, available) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/rooms/${roomId}/availability`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ available })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update room availability');
        }
        
        showAdminMessage(`Room marked as ${available ? 'available' : 'unavailable'}`, 'success');
        
        // Reload rooms
        loadRooms();
        
    } catch (error) {
        console.error('Error updating room availability:', error);
        showAdminMessage('Failed to update room availability. Please try again.', 'error');
    }
}

/**
 * Load all bookings
 */
async function loadBookings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }
        
        const bookings = await response.json();
        displayBookings(bookings);
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        showAdminMessage('Failed to load bookings. Please try again.', 'error');
    }
}

/**
 * Display bookings in the admin panel
 */
function displayBookings(bookings) {
    const bookingsList = document.getElementById('admin-bookings-list');
    if (!bookingsList) return;
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <p>No bookings found.</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => {
        const checkInDate = new Date(booking.checkIn).toLocaleDateString();
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
        const room = booking.room;
        const user = booking.user;
        
        // Calculate status class for styling
        let statusClass = '';
        switch(booking.status) {
            case 'confirmed': statusClass = 'status-confirmed'; break;
            case 'pending': statusClass = 'status-pending'; break;
            case 'cancelled': statusClass = 'status-cancelled'; break;
            case 'completed': statusClass = 'status-completed'; break;
        }
        
        return `
            <div class="booking-card" data-booking-id="${booking._id}" data-booking-status="${booking.status}" data-booking-date="${booking.checkIn}">
                <div class="booking-details">
                    <h3>Booking #${booking._id.substring(0, 8)}</h3>
                    <p class="booking-room">Room: ${room.name}</p>
                    <p class="booking-user">Guest: ${user.name}</p>
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
                    ${booking.status === 'pending' ? `
                        <button class="btn-small confirm-booking" data-booking-id="${booking._id}">Confirm</button>
                        <button class="btn-small cancel-booking" data-booking-id="${booking._id}">Cancel</button>
                    ` : ''}
                    ${booking.status === 'confirmed' ? `
                        <button class="btn-small complete-booking" data-booking-id="${booking._id}">Mark Completed</button>
                        <button class="btn-small cancel-booking" data-booking-id="${booking._id}">Cancel</button>
                    ` : ''}
                    <button class="btn-small view-booking" data-booking-id="${booking._id}">View Details</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to booking action buttons
    document.querySelectorAll('.confirm-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            updateBookingStatus(bookingId, 'confirmed');
        });
    });
    
    document.querySelectorAll('.complete-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            updateBookingStatus(bookingId, 'completed');
        });
    });
    
    document.querySelectorAll('.cancel-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            updateBookingStatus(bookingId, 'cancelled');
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
 * Filter bookings based on selected filters
 */
function filterBookings() {
    const statusFilter = document.getElementById('admin-booking-status-filter').value;
    const dateFilter = document.getElementById('booking-date-filter').value;
    
    const bookingCards = document.querySelectorAll('.booking-card');
    
    bookingCards.forEach(card => {
        const bookingStatus = card.getAttribute('data-booking-status');
        const bookingDate = card.getAttribute('data-booking-date');
        
        let showCard = true;
        
        // Apply status filter
        if (statusFilter !== 'all' && bookingStatus !== statusFilter) {
            showCard = false;
        }
        
        // Apply date filter
        if (dateFilter && bookingDate) {
            const filterDate = new Date(dateFilter).toISOString().split('T')[0];
            const cardDate = new Date(bookingDate).toISOString().split('T')[0];
            
            if (filterDate !== cardDate) {
                showCard = false;
            }
        }
        
        card.style.display = showCard ? 'flex' : 'none';
    });
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, status) {
    try {
        if (!confirm(`Are you sure you want to mark this booking as ${status}?`)) {
            return;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update booking status');
        }
        
        showAdminMessage(`Booking status updated to ${status}`, 'success');
        
        // Reload bookings
        loadBookings();
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        showAdminMessage('Failed to update booking status. Please try again.', 'error');
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
 * Load all users
 */
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const users = await response.json();
        displayUsers(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminMessage('Failed to load users. Please try again.', 'error');
    }
}

/**
 * Display users in the admin panel
 */
function displayUsers(users) {
    const usersList = document.getElementById('admin-users-list');
    if (!usersList) return;
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="no-users">
                <p>No users found.</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = users.map(user => {
        return `
            <div class="user-card" data-user-id="${user._id}">
                <div class="user-details">
                    <h3>${user.name}</h3>
                    <p class="user-email"><i class="fas fa-envelope"></i> ${user.email}</p>
                    <p class="user-phone"><i class="fas fa-phone"></i> ${user.phone}</p>
                    <p class="user-role"><i class="fas fa-user-tag"></i> Role: ${user.role}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-small view-user-bookings" data-user-id="${user._id}">View Bookings</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to user action buttons
    document.querySelectorAll('.view-user-bookings').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            viewUserBookings(userId);
        });
    });
}

/**
 * View user bookings
 */
async function viewUserBookings(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user bookings');
        }
        
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            alert('This user has no bookings.');
            return;
        }
        
        // In a real application, you would display these bookings in a modal
        alert(`User has ${bookings.length} bookings.`);
        
    } catch (error) {
        console.error('Error loading user bookings:', error);
        showAdminMessage('Failed to load user bookings. Please try again.', 'error');
    }
}

/**
 * Display admin messages
 */
function showAdminMessage(message, type = 'info') {
    // Check if message container exists, if not create it
    let messageContainer = document.querySelector('.admin-message');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'admin-message';
        const adminContent = document.querySelector('.admin-content');
        if (adminContent) {
            adminContent.prepend(messageContainer);
        }
    }

    // Set message content and style
    messageContainer.textContent = message;
    messageContainer.className = `admin-message ${type}`;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            messageContainer.remove();
        }, 500);
    }, 5000);
}