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
- Upload and view property images

The application also includes an admin dashboard for administrators to:
- View and manage all properties in the system
- View and manage all bookings
- Approve or reject pending bookings
- Manage user roles (admin, listing agent, user)
- See statistics about properties and bookings

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS
- **Image Storage**: MongoDB GridFS-like approach

## Project Structure

```
├── src/
│   ├── app/                  # Next.js 13+ App Router directory
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Authentication endpoints (login, register, me, verify)
│   │   │   ├── properties/   # Property CRUD endpoints
│   │   │   ├── bookings/     # Booking CRUD endpoints
│   │   │   ├── images/       # Image retrieval endpoints
│   │   │   ├── upload/       # Image upload endpoint
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
│   │   ├── propertyUtils.ts  # Property utilities
│   │   ├── propertyVisibility.ts # Property visibility utilities
│   │   ├── validationUtils.ts # Input validation utilities
│   │   ├── bookingUtils.ts   # Booking utilities
│   │   └── logger.ts         # Logging utilities
│   └── models/               # MongoDB models
│       ├── User.ts           # User model schema
│       ├── Property.ts       # Property model schema
│       ├── Booking.ts        # Booking model schema
│       └── Image.ts          # Image model schema
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
  uppdateradDatum: Date; // Default: Current date - Last update date
  senastInloggning?: Date; // Last login date
}
```

### Property Model
```typescript
{
  namn: string;           // Required - Name
  beskrivning: string;    // Required - Description
  plats: string;          // Required - Location
  prisPerNatt: number;    // Required - Price per night
  bilder: string[];       // Array of image URLs/IDs
  tillganglighet: boolean; // Default: true - Availability
  status: string;         // Property status: active, inactive, pending_review, rejected
  agare: ObjectId;        // Reference to User, Required - Owner
  skapadDatum: Date;      // Default: Current date - Creation date
  uppdateradDatum: Date;  // Default: Current date - Last update date
  godkandDatum?: Date;    // Approval date
  godkandAv?: ObjectId;   // Reference to User - Approved by
  avvisningsAnledning?: string; // Rejection reason
}
```

### Booking Model
```typescript
{
  skapadDatum: Date;         // Default: Current date - Creation date
  incheckningDatum: Date;    // Required - Check-in date
  utcheckningDatum: Date;    // Required - Check-out date
  totalPris: number;         // Required - Total price (calculated as prisPerNatt * number of nights)
  antalNatter: number;       // Required - Number of nights
  status: string;            // Booking status: pending, accepted, rejected, cancelled, completed
  kund: {                    // Customer information
    fornamn: string;         // Required - First name
    efternamn: string;       // Required - Last name
    telefon: string;         // Required - Phone number
    epost: string;           // Required - Email
  };
  skapadAv: ObjectId;        // Reference to User, Required - User who created the booking
  egendom: ObjectId;         // Reference to Property, Required - Property booked
  godkandDatum?: Date;       // Date when booking was approved
  godkandAv?: ObjectId;      // Reference to User who approved the booking
  avvisningsAnledning?: string; // Reason if booking was rejected
  uppdateradDatum: Date;     // Default: Current date - Last update date
}
```

### Image Model
```typescript
{
  filename: string;       // Image filename
  contentType: string;    // MIME type of the image
  data: Buffer;           // Binary image data
  uploadedBy: ObjectId;   // Reference to User who uploaded the image
  uploadedAt: Date;       // Default: Current date - Upload date
}
```

## API Endpoints

All API responses include a `success` field indicating whether the request was successful.

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

Response:
```json
{
  "token": "string",
  "user": {
    "_id": "string",
    "namn": "string",
    "epost": "string",
    "roll": "string"
  },
  "success": true
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

Response:
```json
{
  "token": "string",
  "user": {
    "_id": "string",
    "namn": "string",
    "epost": "string",
    "roll": "string"
  },
  "success": true
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

Response:
```json
{
  "_id": "string",
  "namn": "string",
  "epost": "string",
  "roll": "string",
  "success": true
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

Response:
```json
{
  "authenticated": true,
  "user": {
    "_id": "string",
    "namn": "string",
    "epost": "string",
    "roll": "string"
  },
  "success": true
}
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
- `agare`: Filter by owner ID (string)
- `status`: Filter by status (active/inactive/pending_review/rejected)

Response:
```json
{
  "properties": [...],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  },
  "success": true
}
```

#### Get Property by ID
```http
GET /api/properties/{id}
```

Response:
```json
{
  "_id": "string",
  "namn": "string",
  "beskrivning": "string",
  "plats": "string",
  "prisPerNatt": "number",
  "bilder": ["string"],
  "tillganglighet": "boolean",
  "status": "string",
  "agare": {
    "_id": "string",
    "namn": "string",
    "epost": "string"
  },
  "skapadDatum": "string",
  "success": true
}
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
  "prisPerNatt": "number",
  "tillganglighet": "boolean",
  "bilder": ["string"]
}
```

Response:
```json
{
  "_id": "string",
  "namn": "string",
  "beskrivning": "string",
  "plats": "string",
  "prisPerNatt": "number",
  "bilder": ["string"],
  "tillganglighet": "boolean",
  "status": "string",
  "agare": "string",
  "skapadDatum": "string",
  "uppdateradDatum": "string",
  "success": true
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
  "prisPerNatt": "number",
  "tillganglighet": "boolean",
  "bilder": ["string"]
}
```

Response:
```json
{
  "_id": "string",
  "namn": "string",
  "beskrivning": "string",
  "plats": "string",
  "prisPerNatt": "number",
  "bilder": ["string"],
  "tillganglighet": "boolean",
  "status": "string",
  "agare": "string",
  "skapadDatum": "string",
  "uppdateradDatum": "string",
  "success": true
}
```

#### Delete Property
```http
DELETE /api/properties/{id}
Authorization: Bearer {token}
```

Response:
```json
{
  "message": "Egendomen har tagits bort",
  "success": true
}
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

Response:
```json
{
  "message": "Egendomens status uppdaterad till active",
  "property": { ... },
  "success": true
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

Response:
```json
{
  "message": "3 egendomar uppdaterade till status active",
  "modifiedCount": 3,
  "matchedCount": 3,
  "success": true
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

Response:
```json
{
  "bookings": [...],
  "success": true
}
```

#### Get Booking by ID
```http
GET /api/bookings/{id}
Authorization: Bearer {token}
```

Response:
```json
{
  "_id": "string",
  "incheckningDatum": "string",
  "utcheckningDatum": "string",
  "totalPris": "number",
  "antalNatter": "number",
  "status": "string",
  "kund": {
    "fornamn": "string",
    "efternamn": "string",
    "telefon": "string",
    "epost": "string"
  },
  "egendom": { ... },
  "skapadAv": { ... },
  "skapadDatum": "string",
  "success": true
}
```

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

Response:
```json
{
  "_id": "string",
  "incheckningDatum": "string",
  "utcheckningDatum": "string",
  "totalPris": "number",
  "antalNatter": "number",
  "status": "pending",
  "kund": { ... },
  "egendom": "string",
  "skapadAv": "string",
  "skapadDatum": "string",
  "success": true
}
```

#### Update Booking
```http
PUT /api/bookings/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "accepted" | "rejected",
  "avvisningsAnledning": "string" // Required only when status is "rejected"
}
```

Response:
```json
{
  "_id": "string",
  "status": "accepted",
  "godkandDatum": "string",
  "godkandAv": "string",
  "success": true
}
```

#### Cancel Booking
```http
DELETE /api/bookings/{id}
Authorization: Bearer {token}
```

Response:
```json
{
  "message": "Bokningen har avbokats",
  "success": true
}
```

#### Approve Booking (Listing Agents and Admins)
```http
POST /api/bookings/{id}/approve
Authorization: Bearer {token}
```

Response:
```json
{
  "_id": "string",
  "status": "accepted",
  "godkandDatum": "string",
  "godkandAv": "string",
  "success": true
}
```

#### Reject Booking (Listing Agents and Admins)
```http
POST /api/bookings/{id}/reject
Content-Type: application/json
Authorization: Bearer {token}

{
  "avvisningsAnledning": "string"  // Reason for rejection
}
```

Response:
```json
{
  "_id": "string",
  "status": "rejected",
  "avvisningsAnledning": "string",
  "success": true
}
```

### Images and Uploads

#### Upload Images
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form data:
  - files: File[] (image files)
```

Response:
```json
{
  "message": "Filer uppladdade",
  "urls": ["/api/images/64a7b3c1a2b3c4d5e6f7g8h9"],
  "success": true
}
```

#### Get Image by ID
```http
GET /api/images/{id}
```

Response: Binary image data with appropriate Content-Type header

## Project Requirements (Assignment)

### Godkänd (G): ✅ All requirements fulfilled
- ✅ Grundläggande funktionalitet för CRUD-operationer för Property fungerar korrekt.
- ✅ Hantering av Properties där manipulering av egendomar så som (POST, PUT och DELETE) kan endast göras av en inloggad användare.
- ✅ API-rutter är korrekt implementerade och svarar som förväntat.
- ✅ Redovisat fungerande funktionalitet med en sammanhängande front och backend.
- ✅ Enkel autentisering är implementerad.
- ✅ All backend ska vara typad. Detta innebär att man i största mån undviker att typecasta till any och liknande genvägar.

### Väl Godkänd (VG): ✅ Alla 3 krav har uppfyllts (endast 2 krävs)
- ✅ **Booking (lätt)**: Bokningar kan endast skapas av en inloggad användare och innehåller användaruppgifter (se ovan) och property. Totalpriset beräknas baserat på pris per natt och vistelselängd.
  - Implementerat i `BookingForm.tsx` och `src/app/api/bookings/route.ts`
  - Automatisk prisberäkning baserat på antal nätter

- ✅ **Property/Listing (medel)**: Listings ska endast kunnas ta bort uppdateras av den som skapade dem dock så ska det vara möjligt för en (admin) att ta bort dem.
  - Implementerat i `PropertySchema.methods.canEdit` i `Property.ts` modellen
  - Administratörer kan ta bort/uppdatera alla egendomar
  - Användare kan endast ta bort/uppdatera sina egna egendomar

- ✅ **ListingAgent (svårare)**: Utveckling på booking flödet som ser en parten som user och andra som ListingAgent där ListingAgent måste godta bokningen och innan dess så har bokningen en pending status. Godtas den så blir Booking status accepted annars rejected
  - Implementerat i `BookingStatus` enum i `Booking.ts`
  - Implementerat i approve/reject endpoints i `api/bookings/[id]/approve` och `api/bookings/[id]/reject`
  - ListingAgents måste godkänna bokningar från användare

## Additional Features

- **MongoDB Image Storage**: Implementerat säker lagring av bilder i MongoDB med buffrar
- **Admin Dashboard**: Fullständig admin-kontrollpanel för att hantera egendomar, bokningar och användare
- **Role-Based Access Control**: Detaljerad rollhantering med USER, ADMIN och LISTING_AGENT roller
- **Consistent API Responses**: Alla API-svar innehåller ett `success`-fält för konsistent felhantering
- **TypeScript Everywhere**: Hela applikationen är byggd med noggrann typning i både frontend och backend