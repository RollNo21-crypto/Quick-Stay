// Booking form functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get room ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    
    if (!roomId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize booking form
    initializeBookingForm(roomId);
});

/**
 * Initialize booking form and its event listeners
 */
function initializeBookingForm(roomId) {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;
    
    // Initialize date pickers
    const checkInInput = document.getElementById('booking-check-in');
    const checkOutInput = document.getElementById('booking-check-out');
    
    if (checkInInput && checkOutInput) {
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        checkInInput.min = today;
        checkInInput.value = today;
        
        // Set checkout min date to check-in date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
        
        checkOutInput.min = tomorrowFormatted;
        checkOutInput.value = tomorrowFormatted;
        
        checkInInput.addEventListener('change', function() {
            checkOutInput.min = this.value;
            
            // If checkout date is before check-in date, reset it
            if (checkOutInput.value && checkOutInput.value < this.value) {
                const nextDay = new Date(this.value);
                nextDay.setDate(nextDay.getDate() + 1);
                checkOutInput.value = nextDay.toISOString().split('T')[0];
            }
            
            // Update total price
            updateTotalPrice();
        });
        
        // Update total price when checkout date changes
        checkOutInput.addEventListener('change', function() {
            updateTotalPrice();
        });
    }
    
    // Update total price when guests count changes
    const guestsInput = document.getElementById('booking-guests');
    if (guestsInput) {
        guestsInput.addEventListener('change', function() {
            updateTotalPrice();
        });
    }
    
    // Handle form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitBooking(roomId);
    });
    
    // Load room details to get price and capacity
    loadRoomDetails(roomId);
    
    // Initial price update
    updateTotalPrice();
}

/**
 * Load room details from API
 */
async function loadRoomDetails(roomId) {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load room details');
        }
        
        const room = await response.json();
        
        // Update booking form price
        const priceDisplay = document.getElementById('booking-price');
        if (priceDisplay) {
            priceDisplay.textContent = `$${room.price}`;
        }
        
        // Store room price in a data attribute for calculations
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.setAttribute('data-room-price', room.price);
        }
        
        // Update max guests in the booking form
        const guestsInput = document.getElementById('booking-guests');
        if (guestsInput) {
            guestsInput.setAttribute('max', room.capacity);
            guestsInput.setAttribute('placeholder', `Max ${room.capacity} guests`);
            guestsInput.value = 1; // Default to 1 guest
        }
        
    } catch (error) {
        console.error('Error loading room details:', error);
        showMessage('Failed to load room details. Please try again.', 'error');
    }
}

/**
 * Update total price based on selected dates and guests
 */
function updateTotalPrice() {
    const bookingForm = document.getElementById('booking-form');
    const checkInInput = document.getElementById('booking-check-in');
    const checkOutInput = document.getElementById('booking-check-out');
    const totalPriceDisplay = document.getElementById('booking-total-price');
    
    if (!bookingForm || !checkInInput || !checkOutInput || !totalPriceDisplay) return;
    
    const roomPrice = parseFloat(bookingForm.getAttribute('data-room-price') || 0);
    
    if (checkInInput.value && checkOutInput.value) {
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (nights > 0) {
            const totalPrice = roomPrice * nights;
            totalPriceDisplay.textContent = `$${totalPrice}`;
            bookingForm.setAttribute('data-total-nights', nights);
            bookingForm.setAttribute('data-total-price', totalPrice);
            
            // Show total price container
            const totalContainer = document.querySelector('.booking-total');
            if (totalContainer) {
                totalContainer.style.display = 'flex';
            }
            
            // Update nights display
            const nightsDisplay = document.getElementById('booking-nights');
            if (nightsDisplay) {
                nightsDisplay.textContent = nights;
            }
        }
    }
}

/**
 * Submit booking to API
 */
async function submitBooking(roomId) {
    try {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user._id) {
            // Redirect to login page
            localStorage.setItem('redirectAfterLogin', window.location.href);
            showMessage('Please login to book a room', 'info');
            
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
            return;
        }
        
        const bookingForm = document.getElementById('booking-form');
        const checkInInput = document.getElementById('booking-check-in');
        const checkOutInput = document.getElementById('booking-check-out');
        const guestsInput = document.getElementById('booking-guests');
        const specialRequestsInput = document.getElementById('booking-special-requests');
        
        // Basic validation
        if (!checkInInput.value || !checkOutInput.value || !guestsInput.value) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Get form data
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
        const guests = parseInt(guestsInput.value);
        const specialRequests = specialRequestsInput.value;
        const totalPrice = parseFloat(bookingForm.getAttribute('data-total-price') || 0);
        
        // Prepare booking data
        const bookingData = {
            roomId,
            userId: user._id,
            checkIn,
            checkOut,
            guests,
            specialRequests,
            totalPrice
        };
        
        // Submit booking
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create booking');
        }
        
        const booking = await response.json();
        
        // Show success message
        showMessage('Booking created successfully! Redirecting to your dashboard...', 'success');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error creating booking:', error);
        showMessage(error.message || 'Failed to create booking. Please try again.', 'error');
    }
}

/**
 * Display messages to the user
 */
function showMessage(message, type = 'info') {
    // Check if message container exists, if not create it
    let messageContainer = document.querySelector('.message-container');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', function() {
        messageElement.remove();
    });
    
    messageElement.appendChild(closeButton);
    messageContainer.appendChild(messageElement);
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }, 5000);
}