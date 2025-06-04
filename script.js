// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers with today and tomorrow as default values
    initializeDatePickers();
    
    // Initialize search form validation
    initializeSearchForm();
    
    // Initialize sticky header
    initializeStickyHeader();
    
    // Initialize hotel card hover effects
    initializeHotelCards();
    
    // Initialize mobile menu toggle
    initializeMobileMenu();
    
    // Initialize room filters
    initRoomFilters();
    
    // Initialize gallery filters and product cards
    initGalleryFilters();
    initProductCards();
    
    // Initialize scroll indicator
    initScrollIndicator();
});

/**
 * Initialize date pickers with default values
 */
function initializeDatePickers() {
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    
    if (checkInInput && checkOutInput) {
        // Set min date to today for both inputs
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format dates as YYYY-MM-DD for input[type="date"]
        const todayFormatted = formatDateForInput(today);
        const tomorrowFormatted = formatDateForInput(tomorrow);
        
        // Set default and min values
        checkInInput.min = todayFormatted;
        checkInInput.value = todayFormatted;
        
        checkOutInput.min = tomorrowFormatted;
        checkOutInput.value = tomorrowFormatted;
        
        // Update checkout min date when checkin changes
        checkInInput.addEventListener('change', function() {
            const newCheckInDate = new Date(this.value);
            const newMinCheckout = new Date(newCheckInDate);
            newMinCheckout.setDate(newMinCheckout.getDate() + 1);
            
            checkOutInput.min = formatDateForInput(newMinCheckout);
            
            // If current checkout is before new checkin + 1, update it
            if (new Date(checkOutInput.value) <= newCheckInDate) {
                checkOutInput.value = formatDateForInput(newMinCheckout);
            }
        });
    }
}

/**
 * Format a Date object as YYYY-MM-DD for input[type="date"]
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Initialize search form validation and submission
 */
function initializeSearchForm() {
    const searchForm = document.querySelector('.search-form');
    const roomTypeSelect = document.getElementById('room_type');
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const roomType = roomTypeSelect.value;
            const checkIn = checkInInput.value;
            const checkOut = checkOutInput.value;
            
            // Basic validation
            if (!checkIn || !checkOut) {
                alert('Please select check-in and check-out dates');
                return;
            }
            
            if (new Date(checkIn) >= new Date(checkOut)) {
                alert('Check-out date must be after check-in date');
                return;
            }
            
            // Search for rooms
            searchRooms(roomType, checkIn, checkOut);
        });
    }
    
    // Load all rooms on page load
    loadRooms();
}

/**
 * Search for rooms based on criteria
 */
async function searchRooms(roomType, checkIn, checkOut) {
    try {
        const response = await fetch('/api/rooms/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomType: roomType,
                checkIn: checkIn,
                checkOut: checkOut
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to search rooms');
        }
        
        const rooms = await response.json();
        displayRooms(rooms);
        
        // Scroll to results
        document.querySelector('.featured-hotels').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
    } catch (error) {
        console.error('Error searching rooms:', error);
        alert('Error searching for rooms. Please try again.');
    }
}

/**
 * Load all available rooms
 */
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) {
            throw new Error('Failed to load rooms');
        }
        
        const rooms = await response.json();
        displayRooms(rooms);
        
    } catch (error) {
        console.error('Error loading rooms:', error);
        // Fallback to static content if API fails
    }
}

/**
 * Display rooms in the hotel grid
 */
function displayRooms(rooms) {
    const hotelGrid = document.querySelector('.hotel-grid');
    if (!hotelGrid) return;
    
    if (rooms.length === 0) {
        hotelGrid.innerHTML = '<div class="no-rooms"><p>No rooms available for the selected criteria.</p></div>';
        return;
    }
    
    hotelGrid.innerHTML = rooms.map(room => `
        <div class="hotel-card" data-room-id="${room._id}">
            <div class="hotel-image">
                <img src="${room.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}" alt="${room.name}">
                <span class="hotel-badge">${room.type.charAt(0).toUpperCase() + room.type.slice(1)}</span>
            </div>
            <div class="hotel-info">
                <h3>${room.name}</h3>
                <div class="hotel-rating">
                    <div class="stars">
                        ${generateStars(room.rating)}
                    </div>
                    <span>${room.rating}</span>
                </div>
                <p class="hotel-location">${room.location}</p>
                <p class="room-capacity">Capacity: ${room.capacity} guests</p>
                <div class="amenities">
                    ${room.amenities.slice(0, 3).map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
                </div>
                <div class="hotel-price">
                    <span class="price">$${room.price}</span>
                    <span class="per-night">/ per night</span>
                </div>
                <a href="#" class="view-details" data-room-id="${room._id}">View Details</a>
            </div>
        </div>
    `).join('');
    
    // Re-initialize hotel card interactions
    initializeHotelCards();
}

/**
 * Generate star rating HTML
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

/**
 * Initialize sticky header behavior
 */
function initializeStickyHeader() {
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero');
    
    if (navbar && heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > heroBottom - 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
}

/**
 * Initialize hotel card hover effects and interactions
 */
function initializeHotelCards() {
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    hotelCards.forEach(card => {
        // Add click event to the entire card
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on the view details button
            if (!e.target.classList.contains('view-details')) {
                const viewDetailsLink = this.querySelector('.view-details');
                if (viewDetailsLink) {
                    viewDetailsLink.click();
                }
            }
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.classList.add('hotel-card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hotel-card-hover');
        });
        
        // Make the hotel image clickable too
        const hotelImage = card.querySelector('.hotel-image');
        if (hotelImage) {
            hotelImage.style.cursor = 'pointer';
            hotelImage.addEventListener('click', function() {
                const roomId = card.getAttribute('data-room-id');
                if (roomId) {
                    window.location.href = `room-details.html?id=${roomId}`;
                }
            });
        }
    });
    
    // Initialize view details buttons
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const roomId = this.getAttribute('data-room-id');
            window.location.href = `room-details.html?id=${roomId}`;
        });
    });
}

/**
 * Initialize mobile menu toggle functionality
 */
function initializeMobileMenu() {
    const menuToggle = document.createElement('div');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    const navbar = document.querySelector('.navbar .container');
    const nav = document.querySelector('nav');
    
    if (navbar && nav) {
        // Insert menu toggle button before the nav element
        navbar.insertBefore(menuToggle, nav);
        
        // Add click event to toggle menu
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('nav-active');
            this.classList.toggle('active');
            
            // Change icon based on state
            if (this.classList.contains('active')) {
                this.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                this.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Hide menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !menuToggle.contains(e.target) && nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                menuToggle.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Add CSS for mobile menu
        addMobileMenuStyles();
    }
}

/**
 * Add mobile menu styles dynamically
 */
function addMobileMenuStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .menu-toggle {
                display: block;
                cursor: pointer;
                font-size: 24px;
                color: #333;
            }
            
            nav {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: white;
                box-shadow: 0 5px 10px rgba(0,0,0,0.1);
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                z-index: 1000;
            }
            
            nav.nav-active {
                max-height: 300px;
            }
            
            nav ul {
                flex-direction: column;
                padding: 20px;
            }
            
            nav ul li {
                margin-bottom: 15px;
            }
        }
        
        @media (min-width: 769px) {
            .menu-toggle {
                display: none;
            }
        }
        
        .navbar-scrolled {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            background-color: rgba(255,255,255,0.95);
        }
        
        .hotel-card-hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
    `;
    
    // Append to head
    document.head.appendChild(style);
}

/**
 * Add smooth scrolling for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for fixed header
                behavior: 'smooth'
            });
        }
    });
});

/**
 * Newsletter subscription form handling
 */
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        
        if (!emailInput || !emailInput.value.trim()) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput.value)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Here you would typically send the email to a server
        // For demo purposes, we'll just show a success message
        alert(`Thank you for subscribing with ${emailInput.value}!`);
        emailInput.value = '';
    });
}


/**
 * Initialize room filters functionality
 */
function initRoomFilters() {
    const filterButtons = document.querySelectorAll('.room-filter .filter-btn');
    const hotelCards = document.querySelectorAll('.hotel-card');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get filter value
                const filterValue = this.getAttribute('data-filter');
                
                // Filter hotel cards
                if (hotelCards.length > 0) {
                    if (filterValue === 'all') {
                        // Show all cards
                        hotelCards.forEach(card => {
                            card.style.display = 'block';
                        });
                    } else {
                        // Show only cards with matching room type
                        hotelCards.forEach(card => {
                            const roomType = card.querySelector('.hotel-badge').textContent.toLowerCase();
                            
                            if (roomType === filterValue) {
                                card.style.display = 'block';
                            } else {
                                card.style.display = 'none';
                            }
                        });
                    }
                }
            });
        });
    }
}

/**
 * Initialize gallery filters with enhanced functionality
 */
function initGalleryFilters() {
    const filterButtons = document.querySelectorAll('.room-filter .filter-btn');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                filterGalleryItems(filterValue);
            });
        });
    }
}

/**
 * Enhanced gallery filtering with smooth transitions
 */
function filterGalleryItems(category) {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.opacity = '0';
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
            }, 50);
        } else {
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

/**
 * Initialize product card functionality
 */
function initProductCards() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        const viewBtn = item.querySelector('.view-room-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const roomType = item.getAttribute('data-category');
                showRoomDetails(roomType);
            });
        }
    });
}

/**
 * Show detailed room information in a modal
 */
function showRoomDetails(roomType) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'room-details-modal';
    
    // Sample room data - in a real app this would come from an API
    const roomData = {
        'standard': {
            name: 'Standard Room',
            description: 'Comfortable and affordable room with all basic amenities',
            images: [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                'https://images.unsplash.com/photo-1582719474627-5fe37283cd77',
                'https://images.unsplash.com/photo-1566669437685-d2e3f3a1a091',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945'
            ],
            amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Coffee Maker', 'Hair Dryer'],
            capacity: '2 guests',
            size: '25 sqm',
            price: '$99/night',
            nearby: ['Beach - 500m', 'Restaurants - 200m', 'Shopping - 300m']
        },
        // Similar data objects for other room types...
    };
    
    const room = roomData[roomType] || roomData['standard'];
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>${room.name}</h2>
            
            <div class="room-images">
                ${room.images.map(img => `<img src="${img}" alt="${room.name}">`).join('')}
            </div>
            
            <div class="room-info">
                <p class="description">${room.description}</p>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>${room.capacity}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${room.size}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>${room.price}</span>
                    </div>
                </div>
                
                <h3>Amenities</h3>
                <div class="amenities-grid">
                    ${room.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
                </div>
                
                <h3>Nearby Attractions</h3>
                <div class="nearby-grid">
                    ${room.nearby.map(place => `<span class="nearby">${place}</span>`).join('')}
                </div>
                
                <button class="book-now-btn">Book Now</button>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Initialize scroll indicator to show scroll progress
 */
function initScrollIndicator() {
    // Create scroll indicator element if it doesn't exist
    let scrollIndicator = document.querySelector('.scroll-progress-indicator');
    
    if (!scrollIndicator) {
        scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'scroll-progress-indicator';
        document.body.appendChild(scrollIndicator);
        
        // Add CSS for scroll indicator
        const style = document.createElement('style');
        style.textContent = `
            .scroll-progress-indicator {
                position: fixed;
                top: 0;
                left: 0;
                height: 4px;
                background: linear-gradient(to right, #4CAF50, #2196F3);
                width: 0%;
                z-index: 9999;
                transition: width 0.2s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update scroll indicator width on scroll
    window.addEventListener('scroll', function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPosition = window.scrollY;
        const scrollPercentage = (scrollPosition / windowHeight) * 100;
        
        scrollIndicator.style.width = scrollPercentage + '%';
        
        // Add class to hero scroll indicator to hide it when scrolled down
        const heroScrollIndicator = document.querySelector('.hero-scroll-indicator');
        if (heroScrollIndicator) {
            if (scrollPosition > 100) {
                heroScrollIndicator.classList.add('hidden');
            } else {
                heroScrollIndicator.classList.remove('hidden');
            }
        }
    });
    
    // Add CSS for hero scroll indicator
    const style = document.createElement('style');
    style.textContent = `
        .hero-scroll-indicator.hidden {
            opacity: 0;
            visibility: hidden;
        }
        
        .hero-scroll-indicator {
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}