# Saccos BnB App

A modern bed & breakfast booking application built with Next.js 13+ App Router, MongoDB, and TypeScript.

## Project Overview

Saccos BnB is a full-stack application that allows users to:
- Register and login with JWT authentication
- Browse available properties
- View detailed property information
- Create, edit, and delete properties (for authenticated users)
- Book properties with automatic price calculation
- Manage and cancel bookings

The application also includes an admin dashboard for administrators to:
- View and manage all properties in the system
- View and manage all bookings
- See statistics about properties and bookings

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS

## Project Structure

```
├── src/
│   ├── app/                  # Next.js 13+ App Router directory
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Authentication endpoints (login, register, me, verify)
│   │   │   ├── properties/   # Property CRUD endpoints
│   │   │   ├── bookings/     # Booking CRUD endpoints
│   │   │   └── health/       # Health check endpoint
│   │   ├── admin/            # Admin dashboard
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── properties/       # Property pages
│   │   │   ├── [id]/         # Property details page
│   │   │   │   └── edit/     # Edit property page
│   │   │   └── new/          # Create new property page
│   │   ├── bookings/         # Bookings management page
│   │   ├── layout.tsx        # Root layout component
│   │   ├── page.tsx          # Home page component
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable UI components
│   │   ├── BookingForm.tsx   # Booking form component
│   │   ├── ErrorMessage.tsx  # Error message component
│   │   ├── Layout.tsx        # Layout component
│   │   ├── LoadingSpinner.tsx # Loading spinner component
│   │   ├── Navigation.tsx    # Navigation component
│   │   └── PropertyForm.tsx  # Property form component
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # MongoDB connection handler
│   │   ├── mongodb.ts        # MongoDB utilities
│   │   └── propertyUtils.ts  # Property utilities
│   └── models/               # MongoDB models
│       ├── User.ts           # User model schema
│       ├── Property.ts       # Property model schema
│       └── Booking.ts        # Booking model schema
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- MongoDB installed locally or a MongoDB Atlas account
- npm or yarn package manager

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
MONGODB_URI=mongodb://localhost:27017/bnb-app
JWT_SECRET=your-secret-key-value
```

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env.local`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### CSS Configuration

The project uses Tailwind CSS for styling. The configuration files are:

- `tailwind.config.js`: Configures content paths and theme settings
- `postcss.config.js`: Sets up PostCSS plugins for Tailwind
- `src/app/globals.css`: Contains Tailwind directives and global styles

If you encounter styling issues, ensure these files are properly configured:

```bash
# Reinstall Tailwind CSS and its dependencies
npm install -D tailwindcss@3.3.0 postcss autoprefixer

# Generate configuration files
npx tailwindcss init -p
```

Then make sure your `tailwind.config.js` includes the correct content paths:

```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "namn": "string",
  "epost": "string",
  "losenord": "string"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "epost": "string",
  "losenord": "string"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Properties

#### Get All Properties
```http
GET /api/properties
```

Query parameters:
- `limit`: Number of properties per page (default: 10)
- `page`: Page number (default: 1)
- `tillganglighet`: Filter by availability (true/false)
- `plats`: Filter by location (string)
- `minPris`: Filter by minimum price (number)
- `maxPris`: Filter by maximum price (number)

#### Get Property by ID
```http
GET /api/properties/{id}
```

#### Create Property
```http
POST /api/properties
Content-Type: application/json
Authorization: Bearer {token}

{
  "namn": "string",
  "beskrivning": "string",
  "plats": "string",
  "prisPerNatt": number,
  "tillganglighet": boolean
}
```

#### Update Property
```http
PUT /api/properties/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "namn": "string",
  "beskrivning": "string",
  "plats": "string",
  "prisPerNatt": number,
  "tillganglighet": boolean
}
```

#### Delete Property
```http
DELETE /api/properties/{id}
Authorization: Bearer {token}
```

### Bookings

#### Get User Bookings
```http
GET /api/bookings
Authorization: Bearer {token}
```

Query parameters:
- `propertyId`: Filter by property ID (string)
- `onlyMine`: For admins, filter to only show their bookings (boolean)

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer {token}

{
  "egendom": "string",         // Property ID
  "incheckningDatum": "string", // Check-in date (YYYY-MM-DD)
  "utcheckningDatum": "string"  // Check-out date (YYYY-MM-DD)
}
```

The total price is automatically calculated on the server based on:
- The property's price per night
- The number of nights between check-in and check-out dates

#### Cancel Booking
```http
DELETE /api/bookings/{id}
Authorization: Bearer {token}
```

## Data Models

### User Model
```typescript
{
  namn: string;        // Required - Name
  epost: string;       // Required, Unique - Email
  losenord: string;    // Required, Min length: 6 - Password
  isAdmin: boolean;    // Default: false - Admin status
  skapadDatum: Date;   // Default: Current date - Creation date
}
```

### Property Model
```typescript
{
  namn: string;           // Required - Name
  beskrivning: string;    // Required - Description
  plats: string;          // Required - Location
  prisPerNatt: number;    // Required - Price per night
  tillganglighet: boolean; // Default: true - Availability
  skapadAv: ObjectId;     // Reference to User, Required - Created by
  skapadDatum: Date;      // Default: Current date - Creation date
}
```

### Booking Model
```typescript
{
  skapadDatum: Date;         // Default: Current date - Creation date
  incheckningDatum: Date;    // Required - Check-in date
  utcheckningDatum: Date;    // Required - Check-out date
  totalPris: number;         // Required - Total price (calculated as prisPerNatt * number of nights)
  user: ObjectId;            // Reference to User, Required - User who booked
  egendom: ObjectId;         // Reference to Property, Required - Property booked
}
```

## Shared Components and Utilities

### Components
- **BookingForm**: Form for creating property bookings with date selection and automatic price calculation
- **ErrorMessage**: Displays error messages with optional back button
- **LoadingSpinner**: Shows a loading spinner during async operations
- **Navigation**: Dynamic navigation menu with authentication state awareness
- **PropertyForm**: Reusable form for creating and editing properties

### Utilities
- **auth.ts**: JWT authentication utilities
- **db.ts**: MongoDB connection handler
- **propertyUtils.ts**: Shared functions for property operations

## Admin Functionality

The Saccos BnB application includes a comprehensive admin dashboard for managing the platform:

### Admin Dashboard

- **Access Control**: Only users with admin privileges can access the admin dashboard
- **Statistics Overview**: View key metrics including total properties, bookings, users, and revenue
- **Property Management**: View, edit, and delete all properties on the platform
- **Booking Management**: View all bookings and cancel upcoming bookings if necessary
- **User Management**: View all users and promote regular users to admin status

### Access Control

Admin functionality is protected through:
- JWT token verification
- Role-based access control
- Protected API endpoints

To access the admin dashboard, navigate to `/admin` when logged in as an admin user.

### Making a User an Admin

For testing purposes, you can make a user an admin using the provided script:

```bash
# Install dependencies if not already installed
npm install

# Run the script with the user's email
node scripts/make-admin.js user@example.com
```

This will update the user's status in the database directly, allowing them to access the admin dashboard.

### Testing Admin Functionality

The project includes tests to verify that the admin functionality is working correctly:

```bash
# Install test dependencies
npm install --save-dev chai node-fetch jsonwebtoken

# Run the tests
npx mocha tests/admin.test.js
```

These tests verify:
- The admin middleware correctly restricts access to admin-only endpoints
- Admin users can access protected endpoints
- Regular users are denied access to admin endpoints

## Current Features

- User registration and login
- JWT authentication
- Property listing and details view
- Property creation, editing, and deletion (for owners and admins)
- Booking system with automatic price calculation based on nights and price per night
- Booking management (view and cancel bookings)
- Admin dashboard for system-wide management
- Responsive design with Tailwind CSS

## Upcoming Features

- User profile management
- Advanced search and filtering for properties
- Reviews and ratings
- Payment integration
- Email notifications for bookings

## Development Guidelines

- Follow the existing code structure and naming conventions
- Use TypeScript for type safety
- Implement proper error handling
- Write clean, maintainable code
- Use shared components and utilities when possible
- Follow the DRY (Don't Repeat Yourself) principle

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
