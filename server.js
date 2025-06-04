require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'quickstay-secret-key';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MongoDB Atlas URI is not defined in .env file');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB Atlas...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please check your .env file and MongoDB Atlas connection string.');
    process.exit(1);
});

// Room Schema
const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['standard', 'deluxe', 'suite', 'presidential', 'family', 'business']
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    amenities: [String],
    capacity: {
        type: Number,
        required: true
    },
    images: [String],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 4.5
    },
    available: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        default: 'Miami, FL' // Since all rooms are in same location
    },
    nearbyAttractions: {
        type: [{
            name: String,
            distance: String,
            description: String,
            image: String
        }],
        default: []
    },
    detailedAmenities: {
        type: [{
            category: String,
            items: [String]
        }],
        default: []
    },
    reviews: {
        type: [{
            user: String,
            rating: Number,
            comment: String,
            date: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    }
}, {
    timestamps: true
});

const Room = mongoose.model('Room', roomSchema);

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^\S+@\S+\.\S+$/
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Auth Schema
const authSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^\S+@\S+\.\S+$/
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Auth = mongoose.model('Auth', authSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Routes

// Get all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({ available: true });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get rooms by type
app.get('/api/rooms/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const rooms = await Room.find({ type: type, available: true });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search rooms with filters
app.post('/api/rooms/search', async (req, res) => {
    try {
        const { roomType, checkIn, checkOut, capacity } = req.body;
        
        let query = { available: true };
        
        if (roomType && roomType !== '') {
            query.type = roomType;
        }
        
        if (capacity) {
            query.capacity = { $gte: capacity };
        }
        
        const rooms = await Room.find(query).sort({ price: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get room by ID
app.get('/api/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new room (for admin purposes)
app.post('/api/rooms', async (req, res) => {
    try {
        const room = new Room(req.body);
        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update room availability
app.patch('/api/rooms/:id/availability', async (req, res) => {
    try {
        const { available } = req.body;
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { available },
            { new: true }
        );
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Initialize sample data
app.post('/api/init-data', async (req, res) => {
    try {
        // Check if data already exists
        const existingRooms = await Room.countDocuments();
        if (existingRooms > 0) {
            return res.json({ message: 'Data already exists' });
        }

        const sampleRooms = [
            {
                name: 'Ocean View Standard',
                type: 'standard',
                price: 150,
                description: 'Comfortable standard room with ocean view and modern amenities. Enjoy the beautiful Miami coastline from your window and relax in our cozy accommodations designed for your comfort.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Coffee Maker', 'Hair Dryer', 'Iron & Ironing Board'],
                capacity: 2,
                images: [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
                    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
                    'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f'
                ],
                rating: 4.2,
                nearbyAttractions: [
                    {
                        name: 'Miami Beach',
                        distance: '0.5 miles',
                        description: 'Enjoy the sun and surf at the famous Miami Beach, just a short walk from our hotel.',
                        image: 'https://images.unsplash.com/photo-1575364289437-fb1479c1ce13'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    },
                    {
                        name: 'Wynwood Walls',
                        distance: '3.5 miles',
                        description: 'Visit the vibrant outdoor museum showcasing large-scale works by some of the world\'s best-known street artists.',
                        image: 'https://images.unsplash.com/photo-1580058365434-3c8eca13d122'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Towels', 'Shower', 'Toiletries']
                    },
                    {
                        category: 'Bedroom',
                        items: ['Queen Bed', 'Linens', 'Alarm Clock', 'Reading Lamps']
                    },
                    {
                        category: 'Entertainment',
                        items: ['Flat-screen TV', 'Cable Channels', 'WiFi']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Mini Fridge', 'Coffee Maker', 'Water Bottles']
                    }
                ],
                reviews: [
                    {
                        user: 'John D.',
                        rating: 4.5,
                        comment: 'Great room with a beautiful view. The staff was very friendly and helpful.',
                        date: new Date('2023-06-15')
                    },
                    {
                        user: 'Sarah M.',
                        rating: 4.0,
                        comment: 'Clean and comfortable. The beach access was convenient.',
                        date: new Date('2023-07-22')
                    }
                ]
            },
            {
                name: 'Luxury Deluxe Suite',
                type: 'deluxe',
                price: 280,
                description: 'Spacious deluxe room with premium furnishing and balcony. Indulge in luxury with our carefully selected furnishings and enjoy the ocean breeze from your private balcony.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Balcony', 'Room Service', 'Premium Toiletries', 'Bathrobe & Slippers'],
                capacity: 3,
                images: [
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd'
                ],
                rating: 4.6,
                nearbyAttractions: [
                    {
                        name: 'Miami Beach',
                        distance: '0.5 miles',
                        description: 'Enjoy the sun and surf at the famous Miami Beach, just a short walk from our hotel.',
                        image: 'https://images.unsplash.com/photo-1575364289437-fb1479c1ce13'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    },
                    {
                        name: 'Wynwood Walls',
                        distance: '3.5 miles',
                        description: 'Visit the vibrant outdoor museum showcasing large-scale works by some of the world\'s best-known street artists.',
                        image: 'https://images.unsplash.com/photo-1580058365434-3c8eca13d122'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Premium Towels', 'Rainfall Shower', 'Luxury Toiletries', 'Bathrobe & Slippers']
                    },
                    {
                        category: 'Bedroom',
                        items: ['King Bed', 'Premium Linens', 'Pillow Menu', 'Blackout Curtains']
                    },
                    {
                        category: 'Entertainment',
                        items: ['55-inch Smart TV', 'Premium Cable', 'High-speed WiFi', 'Bluetooth Speaker']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Mini Bar', 'Nespresso Machine', 'Tea Kettle', 'Complimentary Snacks']
                    }
                ],
                reviews: [
                    {
                        user: 'Michael R.',
                        rating: 5.0,
                        comment: 'Absolutely stunning room with incredible views. The balcony was perfect for morning coffee.',
                        date: new Date('2023-05-10')
                    },
                    {
                        user: 'Emily L.',
                        rating: 4.5,
                        comment: 'Luxurious and comfortable. The room service was excellent.',
                        date: new Date('2023-08-03')
                    }
                ]
            },
            {
                name: 'Executive Suite',
                type: 'suite',
                price: 450,
                description: 'Elegant suite with separate living area and premium amenities. Perfect for both business and leisure travelers who appreciate extra space and luxury.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Living Area', 'Kitchenette', 'Room Service', 'Work Desk', 'Safe', 'Premium Toiletries'],
                capacity: 4,
                images: [
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd',
                    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7'
                ],
                rating: 4.8,
                nearbyAttractions: [
                    {
                        name: 'Miami Beach',
                        distance: '0.5 miles',
                        description: 'Enjoy the sun and surf at the famous Miami Beach, just a short walk from our hotel.',
                        image: 'https://images.unsplash.com/photo-1575364289437-fb1479c1ce13'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    },
                    {
                        name: 'Wynwood Walls',
                        distance: '3.5 miles',
                        description: 'Visit the vibrant outdoor museum showcasing large-scale works by some of the world\'s best-known street artists.',
                        image: 'https://images.unsplash.com/photo-1580058365434-3c8eca13d122'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Premium Towels', 'Rainfall Shower', 'Luxury Toiletries', 'Bathrobe & Slippers', 'Separate Bathtub']
                    },
                    {
                        category: 'Bedroom',
                        items: ['King Bed', 'Premium Linens', 'Pillow Menu', 'Blackout Curtains']
                    },
                    {
                        category: 'Living Area',
                        items: ['Sofa', 'Armchair', 'Coffee Table', 'Dining Table', 'Work Desk']
                    },
                    {
                        category: 'Entertainment',
                        items: ['65-inch Smart TV', 'Premium Cable', 'High-speed WiFi', 'Bluetooth Speaker', 'Additional TV in Bedroom']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Mini Bar', 'Nespresso Machine', 'Tea Kettle', 'Kitchenette', 'Microwave', 'Complimentary Snacks']
                    }
                ],
                reviews: [
                    {
                        user: 'Robert J.',
                        rating: 5.0,
                        comment: 'Perfect for our business trip. The separate living area made it easy to host a small meeting.',
                        date: new Date('2023-04-18')
                    },
                    {
                        user: 'Lisa K.',
                        rating: 4.5,
                        comment: 'Spacious and well-appointed. The kitchenette was a nice bonus.',
                        date: new Date('2023-07-12')
                    }
                ]
            },
            {
                name: 'Presidential Suite',
                type: 'presidential',
                price: 800,
                description: 'Ultimate luxury with panoramic views and exclusive services. Our finest accommodation offers unparalleled luxury and personalized service for the most discerning guests.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Full Bar', 'Living Area', 'Full Kitchen', 'Butler Service', 'Private Terrace', 'Jacuzzi', 'Private Dining'],
                capacity: 6,
                images: [
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427',
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd'
                ],
                rating: 5.0,
                nearbyAttractions: [
                    {
                        name: 'Miami Beach',
                        distance: '0.5 miles',
                        description: 'Enjoy the sun and surf at the famous Miami Beach, just a short walk from our hotel.',
                        image: 'https://images.unsplash.com/photo-1575364289437-fb1479c1ce13'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    },
                    {
                        name: 'Wynwood Walls',
                        distance: '3.5 miles',
                        description: 'Visit the vibrant outdoor museum showcasing large-scale works by some of the world\'s best-known street artists.',
                        image: 'https://images.unsplash.com/photo-1580058365434-3c8eca13d122'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Premium Towels', 'Rainfall Shower', 'Luxury Toiletries', 'Bathrobe & Slippers', 'Jacuzzi Tub', 'Steam Room']
                    },
                    {
                        category: 'Bedroom',
                        items: ['King Bed', 'Premium Linens', 'Pillow Menu', 'Blackout Curtains', 'Walk-in Closet']
                    },
                    {
                        category: 'Living Area',
                        items: ['Sectional Sofa', 'Armchairs', 'Coffee Table', 'Dining Table for 8', 'Work Desk', 'Fireplace']
                    },
                    {
                        category: 'Entertainment',
                        items: ['75-inch Smart TV', 'Premium Cable', 'High-speed WiFi', 'Surround Sound System', 'Multiple TVs']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Full Bar', 'Full Kitchen', 'Wine Cooler', 'Espresso Machine', 'Private Chef Available']
                    },
                    {
                        category: 'Services',
                        items: ['Butler Service', 'Private Check-in', 'Concierge Service', 'Valet Parking', 'Airport Transfer']
                    }
                ],
                reviews: [
                    {
                        user: 'James W.',
                        rating: 5.0,
                        comment: 'An extraordinary experience. The butler service was impeccable and the views were breathtaking.',
                        date: new Date('2023-03-25')
                    },
                    {
                        user: 'Victoria S.',
                        rating: 5.0,
                        comment: 'Worth every penny. The private terrace and jacuzzi made our anniversary unforgettable.',
                        date: new Date('2023-06-30')
                    }
                ]
            },
            {
                name: 'Family Room',
                type: 'family',
                price: 320,
                description: 'Perfect for families with connecting rooms and kid-friendly amenities. Designed with families in mind, offering space, convenience, and entertainment options for all ages.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'Connecting Rooms', 'Kids Area', 'Game Console', 'Cribs Available'],
                capacity: 6,
                images: [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
                    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
                    'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f'
                ],
                rating: 4.4,
                nearbyAttractions: [
                    {
                        name: 'Miami Beach',
                        distance: '0.5 miles',
                        description: 'Enjoy the sun and surf at the famous Miami Beach, just a short walk from our hotel.',
                        image: 'https://images.unsplash.com/photo-1575364289437-fb1479c1ce13'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    },
                    {
                        name: 'Miami Children\'s Museum',
                        distance: '2.8 miles',
                        description: 'Interactive exhibits and programs for children of all ages.',
                        image: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69799'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Towels', 'Shower', 'Toiletries', 'Child-sized Robes']
                    },
                    {
                        category: 'Bedroom',
                        items: ['Queen Beds', 'Bunk Beds', 'Linens', 'Night Lights', 'Cribs Available']
                    },
                    {
                        category: 'Entertainment',
                        items: ['Flat-screen TV', 'Cable Channels', 'WiFi', 'Game Console', 'Board Games']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Mini Fridge', 'Microwave', 'Coffee Maker', 'Kid-friendly Snacks']
                    },
                    {
                        category: 'Services',
                        items: ['Babysitting (on request)', 'Kids Club Access', 'Family Concierge']
                    }
                ],
                reviews: [
                    {
                        user: 'David & Family',
                        rating: 4.5,
                        comment: 'Great setup for our family of 5. The kids loved the bunk beds and game console.',
                        date: new Date('2023-07-05')
                    },
                    {
                        user: 'Amanda T.',
                        rating: 4.0,
                        comment: 'Spacious and comfortable. The connecting rooms gave us privacy while keeping the kids close.',
                        date: new Date('2023-08-15')
                    }
                ]
            },
            {
                name: 'Business Room',
                type: 'business',
                price: 220,
                description: 'Designed for business travelers with work desk and meeting facilities. Stay productive with our business-friendly amenities and convenient location near the business district.',
                amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Work Desk', 'Business Center Access', 'Meeting Room', 'Printer Access', 'Coffee Machine'],
                capacity: 2,
                images: [
                    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
                    'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd',
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945'
                ],
                rating: 4.3,
                nearbyAttractions: [
                    {
                        name: 'Miami Financial District',
                        distance: '1.0 mile',
                        description: 'The business hub of Miami with corporate offices and financial institutions.',
                        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'
                    },
                    {
                        name: 'Miami Convention Center',
                        distance: '2.5 miles',
                        description: 'Host to major conferences and events throughout the year.',
                        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
                    },
                    {
                        name: 'Lincoln Road Mall',
                        distance: '1.2 miles',
                        description: 'Explore the popular shopping district with boutiques, restaurants, and entertainment.',
                        image: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13'
                    }
                ],
                detailedAmenities: [
                    {
                        category: 'Bathroom',
                        items: ['Hair Dryer', 'Towels', 'Shower', 'Toiletries', 'Bathrobe']
                    },
                    {
                        category: 'Bedroom',
                        items: ['King Bed', 'Linens', 'Alarm Clock', 'Reading Lamps', 'Blackout Curtains']
                    },
                    {
                        category: 'Work Space',
                        items: ['Ergonomic Chair', 'Large Desk', 'Desk Lamp', 'Multiple Outlets', 'USB Ports']
                    },
                    {
                        category: 'Entertainment',
                        items: ['Flat-screen TV', 'Cable Channels', 'High-speed WiFi']
                    },
                    {
                        category: 'Food & Drink',
                        items: ['Coffee Machine', 'Tea Kettle', 'Mini Fridge', 'Complimentary Water']
                    },
                    {
                        category: 'Business Services',
                        items: ['Printing', 'Scanning', 'Meeting Room Access', 'Business Center', 'Express Check-out']
                    }
                ],
                reviews: [
                    {
                        user: 'Thomas B.',
                        rating: 4.5,
                        comment: 'Perfect for my business trip. The desk was spacious and the WiFi was reliable.',
                        date: new Date('2023-05-20')
                    },
                    {
                        user: 'Natalie P.',
                        rating: 4.0,
                        comment: 'Comfortable and functional. The business center was well-equipped.',
                        date: new Date('2023-06-10')
                    }
                ]
            }
        ];

        await Room.insertMany(sampleRooms);
        res.json({ message: 'Sample data initialized successfully', count: sampleRooms.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// User API Routes

// Create a new user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        const user = new User({ name, email, phone, address });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, address },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Booking API Routes

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { roomId, userId, checkIn, checkOut, guests, specialRequests } = req.body;
        
        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }
        
        if (checkInDate < new Date()) {
            return res.status(400).json({ error: 'Check-in date cannot be in the past' });
        }
        
        // Check if room exists and is available
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        if (!room.available) {
            return res.status(400).json({ error: 'Room is not available for booking' });
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check for conflicting bookings
        const conflictingBooking = await Booking.findOne({
            room: roomId,
            status: { $nin: ['cancelled'] },
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });
        
        if (conflictingBooking) {
            return res.status(400).json({ error: 'Room is already booked for the selected dates' });
        }
        
        // Calculate total price (number of nights * room price)
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * room.price;
        
        // Create booking
        const booking = new Booking({
            room: roomId,
            user: userId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalPrice,
            specialRequests: specialRequests || ''
        });
        
        await booking.save();
        
        // Update room availability if needed
        // For a real application, you might want to implement a more sophisticated availability system
        // This is a simplified approach
        
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('room', 'name type price')
            .populate('user', 'name email');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get bookings by user ID
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.userId })
            .populate('room', 'name type price images')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('room')
            .populate('user', 'name email phone');
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status
app.patch('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // If booking is cancelled, we might want to update room availability
        // This is a simplified approach
        
        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update payment status
app.patch('/api/bookings/:id/payment', async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        
        if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status value' });
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Only allow cancellation of pending or confirmed bookings
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ error: `Cannot cancel booking with status: ${booking.status}` });
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

// Admin Authorization Middleware
const authorizeAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Authentication Routes

// Register a new user with authentication
app.post('/api/auth/register', async (req, res) => {
    try {
        const { userId, email, password } = req.body;
        
        // Validate input
        if (!userId || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if email matches user email
        if (user.email !== email) {
            return res.status(400).json({ error: 'Email does not match user record' });
        }
        
        // Check if auth already exists for this email
        const existingAuth = await Auth.findOne({ email });
        if (existingAuth) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new auth record
        const auth = new Auth({
            userId,
            email,
            password: hashedPassword
        });
        
        await auth.save();
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find auth record by email
        const auth = await Auth.findOne({ email });
        if (!auth) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, auth.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        // Find user
        const user = await User.findById(auth.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Create and assign token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Protected route example
app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-__v');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create admin user if none exists
async function createAdminUser() {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return;
        }
        
        // Create admin user
        const admin = new User({
            name: 'Admin User',
            email: 'admin@quickstay.com',
            phone: '1234567890',
            address: 'QuickStay HQ',
            role: 'admin'
        });
        
        await admin.save();
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Create admin auth
        const adminAuth = new Auth({
            userId: admin._id,
            email: admin.email,
            password: hashedPassword
        });
        
        await adminAuth.save();
        
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
    
    // Create admin user
    createAdminUser();
});

module.exports = app;