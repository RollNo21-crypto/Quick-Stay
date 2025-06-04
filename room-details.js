// Room details page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get room ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    
    if (!roomId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load room details
    loadRoomDetails(roomId);
    
    // Initialize booking form
    initializeBookingForm(roomId);
});

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
        displayRoomDetails(room);
        
    } catch (error) {
        console.error('Error loading room details:', error);
        showMessage('Failed to load room details. Please try again.', 'error');
    }
}

/**
 * Display room details on the page
 */
function displayRoomDetails(room) {
    // Update page title
    document.title = `${room.name} - Quick Stay`;
    
    // Update room details
    const roomDetailsContainer = document.querySelector('.room-details-container');
    if (!roomDetailsContainer) return;
    
    // Create image gallery with main image and thumbnails
    let mainImage = room.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945';
    
    // If there's only one image, add some default additional images based on room type
    if (room.images.length <= 1) {
        // Add default images based on room type
        const defaultImages = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        ];
        
        // Use the existing image as the first one
        room.images = [mainImage, ...defaultImages.filter(img => img !== mainImage).slice(0, 4)];
    }
    
    // Create thumbnails HTML
    const thumbnailsHTML = room.images.map((image, index) => {
        return `<div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${image}" alt="${room.name} - Image ${index + 1}">
        </div>`;
    }).join('');
    
    // Create gallery HTML with main image and thumbnails
    const galleryHTML = `
        <div class="main-image-container">
            <img src="${mainImage}" alt="${room.name}" class="main-image" id="main-room-image">
            <div class="image-navigation prev-image">
                <i class="fas fa-chevron-left"></i>
            </div>
            <div class="image-navigation next-image">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
        <div class="thumbnail-container">
            ${thumbnailsHTML}
        </div>
    `;
    
    // Format amenities
    const amenitiesHTML = room.amenities.map(amenity => {
        return `<li><i class="fas fa-check"></i> ${amenity}</li>`;
    }).join('');
    
    // Generate star rating
    const ratingHTML = generateStarRating(room.rating || 4.5);
    
    // Store room images for gallery functionality
    window.roomImages = room.images;
    
    // Update room details HTML
    roomDetailsContainer.innerHTML = `
        <div class="room-gallery">
            ${galleryHTML}
        </div>
        <div class="room-info">
            <h1>${room.name}</h1>
            <div class="room-meta">
                <span class="room-type">${room.type.charAt(0).toUpperCase() + room.type.slice(1)}</span>
                <span class="room-rating">${ratingHTML}</span>
                <span class="room-location"><i class="fas fa-map-marker-alt"></i> ${room.location}</span>
            </div>
            <div class="room-price">$${room.price} <span>per night</span></div>
            <div class="room-description">
                <h2>Description</h2>
                <p>${room.description}</p>
            </div>
            <div class="room-features">
                <h2>Room Features</h2>
                <ul class="amenities-list">
                    ${amenitiesHTML}
                </ul>
            </div>
            <div class="room-capacity">
                <h2>Details</h2>
                <ul>
                    <li><i class="fas fa-users"></i> Max Guests: ${room.capacity}</li>
                    <li><i class="fas fa-bed"></i> Bed Type: ${getBedType(room.type)}</li>
                    <li><i class="fas fa-expand-arrows-alt"></i> Room Size: ${getRoomSize(room.type)}</li>
                </ul>
            </div>
        </div>
    `;
    
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
    }
    
    // Initialize image gallery functionality
    initializeImageGallery();
    
    // Display detailed amenities if available
    if (room.detailedAmenities && room.detailedAmenities.length > 0) {
        const detailedAmenitiesContainer = document.getElementById('detailed-amenities');
        if (detailedAmenitiesContainer) {
            detailedAmenitiesContainer.innerHTML = '';
            
            room.detailedAmenities.forEach(category => {
                const categorySection = document.createElement('div');
                categorySection.className = 'amenity-category';
                
                const categoryTitle = document.createElement('h4');
                categoryTitle.textContent = category.category;
                categorySection.appendChild(categoryTitle);
                
                const itemsList = document.createElement('ul');
                category.items.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    itemsList.appendChild(listItem);
                });
                
                categorySection.appendChild(itemsList);
                detailedAmenitiesContainer.appendChild(categorySection);
            });
        }
    }
    
    // Display nearby attractions if available
    if (room.nearbyAttractions && room.nearbyAttractions.length > 0) {
        const attractionsContainer = document.getElementById('attractions-container');
        if (attractionsContainer) {
            attractionsContainer.innerHTML = '';
            
            room.nearbyAttractions.forEach(attraction => {
                const attractionCard = document.createElement('div');
                attractionCard.className = 'attraction-card';
                
                const attractionImg = document.createElement('img');
                attractionImg.src = attraction.image;
                attractionImg.alt = attraction.name;
                attractionCard.appendChild(attractionImg);
                
                const attractionInfo = document.createElement('div');
                attractionInfo.className = 'attraction-info';
                
                const attractionName = document.createElement('h4');
                attractionName.textContent = attraction.name;
                attractionInfo.appendChild(attractionName);
                
                const attractionDistance = document.createElement('p');
                attractionDistance.className = 'attraction-distance';
                attractionDistance.textContent = attraction.distance;
                attractionInfo.appendChild(attractionDistance);
                
                const attractionDesc = document.createElement('p');
                attractionDesc.textContent = attraction.description;
                attractionInfo.appendChild(attractionDesc);
                
                attractionCard.appendChild(attractionInfo);
                attractionsContainer.appendChild(attractionCard);
            });
        }
    }
    
    // Display reviews if available
    if (room.reviews && room.reviews.length > 0) {
        const reviewsContainer = document.getElementById('reviews-container');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = '';
            
            // Calculate average rating
            const avgRating = room.reviews.reduce((sum, review) => sum + review.rating, 0) / room.reviews.length;
            
            // Create review summary
            const reviewSummary = document.createElement('div');
            reviewSummary.className = 'review-summary';
            
            const ratingValue = document.createElement('div');
            ratingValue.className = 'rating-value';
            ratingValue.textContent = avgRating.toFixed(1);
            reviewSummary.appendChild(ratingValue);
            
            const starsContainer = document.createElement('div');
            starsContainer.className = 'stars-container';
            starsContainer.innerHTML = generateStarRating(avgRating);
            reviewSummary.appendChild(starsContainer);
            
            const reviewCount = document.createElement('div');
            reviewCount.className = 'review-count';
            reviewCount.textContent = `${room.reviews.length} ${room.reviews.length === 1 ? 'review' : 'reviews'}`;
            reviewSummary.appendChild(reviewCount);
            
            reviewsContainer.appendChild(reviewSummary);
            
            // Add individual reviews
            const reviewsList = document.createElement('div');
            reviewsList.className = 'reviews-list';
            
            room.reviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                
                const reviewHeader = document.createElement('div');
                reviewHeader.className = 'review-header';
                
                const reviewUser = document.createElement('div');
                reviewUser.className = 'review-user';
                reviewUser.textContent = review.user;
                reviewHeader.appendChild(reviewUser);
                
                const reviewDate = document.createElement('div');
                reviewDate.className = 'review-date';
                reviewDate.textContent = new Date(review.date).toLocaleDateString();
                reviewHeader.appendChild(reviewDate);
                
                reviewItem.appendChild(reviewHeader);
                
                const reviewRating = document.createElement('div');
                reviewRating.className = 'review-rating';
                reviewRating.innerHTML = generateStarRating(review.rating);
                reviewItem.appendChild(reviewRating);
                
                const reviewComment = document.createElement('div');
                reviewComment.className = 'review-comment';
                reviewComment.textContent = review.comment;
                reviewItem.appendChild(reviewComment);
                
                reviewsList.appendChild(reviewItem);
            });
            
            reviewsContainer.appendChild(reviewsList);
        }
    }
}

/**
 * Initialize image gallery with thumbnails and navigation
 */
function initializeImageGallery() {
    const mainImage = document.getElementById('main-room-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevButton = document.querySelector('.prev-image');
    const nextButton = document.querySelector('.next-image');
    
    if (!mainImage || !thumbnails.length || !window.roomImages) return;
    
    let currentIndex = 0;
    const maxIndex = window.roomImages.length - 1;
    
    // Function to update the main image
    function updateMainImage(index) {
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        
        currentIndex = index;
        mainImage.src = window.roomImages[index];
        
        // Update active thumbnail
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index].classList.add('active');
    }
    
    // Add click event to thumbnails
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            updateMainImage(index);
        });
    });
    
    // Add click events to navigation buttons
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            updateMainImage(currentIndex - 1);
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            updateMainImage(currentIndex + 1);
        });
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            updateMainImage(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            updateMainImage(currentIndex + 1);
        }
    });
}

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
        
        // Set checkout min date to check-in date
        checkInInput.addEventListener('change', function() {
            checkOutInput.min = this.value;
            
            // If checkout date is before check-in date, reset it
            if (checkOutInput.value && checkOutInput.value < this.value) {
                checkOutInput.value = '';
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
        if (!token) {
            // Redirect to login page
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'auth.html';
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
            throw new Error(errorData.message || 'Failed to create booking');
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
 * Helper function to generate star rating HTML
 */
function generateStarRating(rating) {
    // Round to nearest half
    const roundedRating = Math.round(rating * 2) / 2;
    let starsHTML = '';
    
    // Add full stars
    for (let i = 1; i <= Math.floor(roundedRating); i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (roundedRating % 1 !== 0) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    const emptyStars = 5 - Math.ceil(roundedRating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return `${starsHTML} <span class="rating-value">${rating}</span>`;
}

/**
 * Helper function to get bed type based on room type
 */
function getBedType(roomType) {
    switch (roomType.toLowerCase()) {
        case 'standard':
            return 'Queen Size';
        case 'deluxe':
            return 'King Size';
        case 'suite':
            return 'King Size + Sofa Bed';
        case 'presidential':
            return 'Emperor Size + Sofa Bed';
        case 'family':
            return '2 Queen Size Beds';
        case 'business':
            return 'King Size';
        default:
            return 'Queen Size';
    }
}

/**
 * Helper function to get room size based on room type
 */
function getRoomSize(roomType) {
    switch (roomType.toLowerCase()) {
        case 'standard':
            return '25 m²';
        case 'deluxe':
            return '35 m²';
        case 'suite':
            return '50 m²';
        case 'presidential':
            return '75 m²';
        case 'family':
            return '45 m²';
        case 'business':
            return '30 m²';
        default:
            return '25 m²';
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