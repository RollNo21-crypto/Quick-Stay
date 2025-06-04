# QuickStay - Hotel Booking System

A modern hotel booking website with MongoDB integration for room management by type.

## Features

- **Room Type Differentiation**: Browse rooms by type (Standard, Deluxe, Suite, Presidential, Family, Business)
- **MongoDB Integration**: Dynamic room data storage and retrieval
- **Search Functionality**: Filter rooms by type and availability dates
- **Responsive Design**: Modern UI that works on all devices
- **Real-time Updates**: Dynamic room display based on search criteria

## Room Types Available

- **Standard Room**: Basic comfort with essential amenities
- **Deluxe Room**: Enhanced comfort with premium features
- **Suite**: Spacious rooms with separate living areas
- **Presidential Suite**: Luxury accommodation with premium services
- **Family Room**: Large rooms designed for families
- **Business Room**: Professional amenities for business travelers

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd "Quick Stay"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/quickstay
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   - For local MongoDB: Ensure MongoDB service is running
   - For MongoDB Atlas: Use the connection string from your cluster

5. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Initialize sample data** (optional)
   ```bash
   npm run init-db
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## API Endpoints

- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/type/:type` - Get rooms by type
- `POST /api/rooms/search` - Search rooms with filters
- `GET /api/rooms/:id` - Get specific room
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id/availability` - Update room availability
- `POST /api/init-data` - Initialize sample room data

## Project Structure

```
Quick Stay/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Node.js backend server
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variables template
└── README.md           # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome

## Development

### Adding New Room Types

1. Update the room type enum in `server.js`:
   ```javascript
   type: {
       type: String,
       enum: ['standard', 'deluxe', 'suite', 'presidential', 'family', 'business', 'new-type'],
       required: true
   }
   ```

2. Add the new option to the HTML select in `index.html`:
   ```html
   <option value="new-type">New Type Room</option>
   ```

### Customizing Room Data

Edit the `initializeSampleData` function in `server.js` to add your own room data.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in `.env`
   - Verify network connectivity for Atlas

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill existing processes on port 3000

3. **Dependencies Issues**
   - Delete `node_modules` and run `npm install` again
   - Ensure Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning and development purposes.