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

## Models

### User Model
```typescript
{
  namn: string;        // Required - Name
  epost: string;       // Required, Unique - Email
  losenord: string;    // Required, Min length: 6 - Password
  roll: string;        // User role: USER, ADMIN, or LISTING_AGENT
  aktiv: boolean;      // Default: true - Account active status
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
  status: string;          // Property status: active, inactive, pending_review, rejected
  agare: ObjectId;         // Reference to User, Required - Created by
  skapadDatum: Date;       // Default: Current date - Creation date
}
```

### Booking Model
```typescript
{
  skapadDatum: Date;         // Default: Current date - Creation date
  incheckningDatum: Date;    // Required - Check-in date
  utcheckningDatum: Date;    // Required - Check-out date
  totalPris: number;         // Required - Total price (calculated as prisPerNatt * number of nights)
  status: string;            // Booking status: pending, accepted, rejected, cancelled, completed
  kund: {                    // Customer information
    fornamn: string;         // Required - First name
    efternamn: string;       // Required - Last name
    telefon: string;         // Required - Phone number
    epost: string;           // Required - Email
  };
  skapadAv: ObjectId;        // Reference to User, Required - User who created the booking
  egendom: ObjectId;         // Reference to Property, Required - Property booked
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

#### Update Property Status (Admin Only)
```http
POST /api/properties/{id}/update-status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "active" | "inactive" | "pending_review" | "rejected",
  "anledning": "string"  // Required only when status is "rejected"
}
```

#### Batch Update Property Statuses (Admin Only)
```http
POST /api/properties/batch-update-status
Content-Type: application/json
Authorization: Bearer {token}

{
  "propertyIds": ["id1", "id2", "id3"],
  "status": "active" | "inactive" | "pending_review" | "rejected",
  "anledning": "string"  // Required only when status is "rejected"
}
```

### Bookings

#### Get User Bookings
```http
GET /api/bookings
Authorization: Bearer {token}
```

Query parameters:
- `propertyId`: Filter by property ID (string)
- `status`: Filter by booking status (string)

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer {token}

{
  "egendom": "string",         // Property ID
  "incheckningDatum": "string", // Check-in date (YYYY-MM-DD)
  "utcheckningDatum": "string", // Check-out date (YYYY-MM-DD)
  "kund": {
    "fornamn": "string",
    "efternamn": "string",
    "telefon": "string",
    "epost": "string"
  }
}
```

#### Cancel Booking
```http
DELETE /api/bookings/{id}
Authorization: Bearer {token}
```

#### Approve Booking (Listing Agents and Admins)
```http
POST /api/bookings/{id}/approve
Authorization: Bearer {token}
```

#### Reject Booking (Listing Agents and Admins)
```http
POST /api/bookings/{id}/reject
Content-Type: application/json
Authorization: Bearer {token}

{
  "anledning": "string"  // Reason for rejection
}
```

## Project Requirements (Assignment)

### Godkänd (G):
- Grundläggande funktionalitet för CRUD-operationer för Property fungerar korrekt.
- Hantering av Properties där manipulering av egendomar så som (POST, PUT och DELETE) kan endast göras av en inloggad användare.
- API-rutter är korrekt implementerade och svarar som förväntat.
- Redovisat fungerande funktionalitet med en sammanhängande front och backend.
- Enkel autentisering är implementerad.
- All backend ska vara typad. Detta innebär att man i största mån undviker att typecasta till any och liknande genvägar.

### Väl Godkänd (VG): Minst 2 av nedan ska ha uppfyltlts
- Booking (lätt): Bokningar kan endast skapas av en inloggad användare och innehåller användaruppgifter (se ovan) och property. Totalpriset beräknas baserat på pris per natt och vistelselängd.
- Property/Listing (medel): Listings ska endast kunnas ta bort uppdateras av den som skapade dem dock så ska det vara möjligt för en (admin) att ta bort dem.
- ListingAgent (svårare): Utveckling på booking flödet som ser en parten som user och andra som ListingAgent där ListingAgent måste godta bokningen och innan dess så har bokningen en pending status. Godtas den så blir Booking status accepted annars rejected