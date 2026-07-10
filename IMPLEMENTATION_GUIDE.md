# Campus Adda - Complete Implementation Guide

## System Overview

This is a role-based event management system with three roles:
- **Admin**: Manages president applications and can edit/delete any events
- **President**: Can create, edit, and delete events (after approval)
- **User**: Can view events and save them

## Database Setup

1. **Create the Database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS college_platform;
   USE college_platform;
   ```

2. **Run the Schema:**
   Execute the SQL queries from `backend/database.sql`:
   ```bash
   mysql -u root -p college_platform < backend/database.sql
   ```

3. **Verify Tables Created:**
   - `users` - User accounts with roles
   - `president_applications` - President approval requests
   - `events` - All events
   - `saved_events` - User bookmarked events
   - `colleges` - College list

## Environment Setup

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=college_platform
ADMIN_USERNAME=aks
ADMIN_PASSWORD=Shukla15@gmail.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=campusadda/documents
```

### Frontend (.env or config)
The frontend uses `http://localhost:5000/api` as base URL (configured in `src/services/api.js`)

## Installation & Running

### Backend
```bash
cd backend
npm install
npm run dev   # or npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Workflow & Features

### 1. Authentication
- **Regular User Registration**: Name, Email, Password
- **President Applicant Registration**: Name, Email, Password, College Name, Roll Number
- **Admin Login**: Via environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)

### 2. President Application Flow
1. User registers as "President Applicant"
2. Automatically creates pending application
3. Admin reviews in Admin Dashboard
4. Admin can approve or reject with comments
5. On approval, user's role changes to "president"

### 3. Event Management

#### For Presidents/Admins:
- Create events with:
  - Name (required)
  - Category: Cultural, Sports, Tech
  - Date (required)
  - Description
  - Optional link
  - Optional photo URL
- Edit their own events
- Delete their own events
- Admins can edit/delete any event

#### For Users:
- View all events
- Filter by category (Cultural, Sports, Tech)
- View event details
- Save/unsave events
- View saved events

### 4. Admin Dashboard
- **President Applications Tab**:
  - View all pending applications
  - See applicant details (name, roll no, college, document)
  - Approve or reject with comments
  
- **Events Tab**:
  - View all events
  - Delete inappropriate events

### Cloudinary Document Uploads
- President applicant PDFs are uploaded to Cloudinary instead of being stored in the local `uploads/` folder.
- Multer reads the file into memory, Cloudinary stores it, and the returned secure URL is saved in `president_applications.document_url`.
- This keeps file storage outside the backend server and avoids managing uploaded files manually.

## API Endpoints

### Authentication
```
POST /api/auth/register     - Register (with role selection)
POST /api/auth/login        - Login
```

### President Applications
```
POST /api/president/apply/:userId              - Submit application
GET /api/president/status/:userId              - Check application status
GET /api/president/applications/pending        - Get pending (Admin only)
PUT /api/president/approve/:applicationId      - Approve (Admin only)
PUT /api/president/reject/:applicationId       - Reject (Admin only)
```

### Events
```
GET /api/events                  - Get all events
GET /api/events/:id              - Get event details
POST /api/events                 - Create event (President/Admin)
PUT /api/events/:id              - Update event
DELETE /api/events/:id           - Delete event
GET /api/events/creator/:id      - Get events by creator
POST /api/events/:eventId/save   - Save event
DELETE /api/events/:eventId/save - Unsave event
GET /api/events/saved/all        - Get saved events
```

## User Flows

### 1. New User Registration & Event Browsing
1. Click Register
2. Choose "Regular User"
3. Fill in Name, Email, Password
4. Click Register and Login
5. Browse home page to see all events
6. Filter by category (Cultural, Sports, Tech)
7. Click event to view details
8. Save events for later
9. View saved events in "Saved" section

### 2. Becoming a President
1. Click Register
2. Choose "President Applicant"
3. Fill in all details (Name, Email, Password, College Name, Roll Number)
4. Click Register and Login
5. Go to President section
6. Fill out application form
7. Submit application
8. Wait for admin approval
9. Once approved, refresh to access event creation

### 3. President - Creating Events
1. Go to President Dashboard
2. Click "+ Create New Event"
3. Fill in:
   - Event Name (required)
   - Category: Cultural/Sports/Tech
   - Date (required)
   - Description
   - Link (optional)
   - Photo URL (optional)
4. Click "Create Event"
5. Event appears in "My Events" section
6. Can edit or delete anytime

### 4. Admin - Managing Applications
1. Login with admin credentials
2. Go to Admin Dashboard
3. Click "President Applications" tab
4. Review pending applications
5. Click "Approve" or enter rejection reason and "Reject"
6. Switch to "Events" tab to manage all events

### 5. Admin - Managing Events
1. Go to Admin Dashboard
2. Click "Events" tab
3. View all events created by presidents/admins
4. Delete inappropriate events

## Key Technical Details

### Role-Based Access Control
- Middleware checks JWT token for user role
- Frontend uses `getUser()` from decoded JWT
- Only presidents and admins can create events
- Admins can edit/delete any event

### Event Ownership
- Each event tracks `created_by` (user ID)
- Presidents can only edit/delete their own events
- Admins can edit/delete any event

### Saved Events
- Users can save events to bookmark them
- Saved events stored in `saved_events` table
- Each user has unique save collection

### President Application Status
- `pending` - Awaiting admin review
- `approved` - Approved, user role updated to president
- `rejected` - Rejected with optional comments

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in .env
- Ensure database exists and tables are created

### API 404 Errors
- Frontend makes requests to `/api/*` endpoints
- Backend should be running on port 5000
- Check CORS settings in backend

### Login Issues
- For admin: use exact ADMIN_USERNAME and ADMIN_PASSWORD from .env
- For users: check database for user records
- Verify JWT_SECRET is consistent

### Event Not Showing
- Check event creation succeeded (check database)
- Verify user role is president or admin
- Check event date is in future (optional)

## File Structure Changes

### Backend
- `controllers/presidentApplicationController.js` - New controller
- `controllers/eventController.js` - Updated with new logic
- `routes/presidentRoutes.js` - Updated routes
- `routes/eventRoutes.js` - Updated routes
- `database.sql` - New database schema

### Frontend
- `pages/AdminDashboard.js` - Completely updated
- `pages/PresidentDashboard.js` - Completely updated
- `pages/Home.js` - Updated with new filters
- `pages/Register.js` - Added role selection
- `pages/SavedEvents.js` - Updated with API calls
- `pages/EventDetails.js` - Completely updated
- `components/EventCard.js` - Completely redesigned

## Next Steps

1. Run database migrations
2. Start backend server
3. Start frontend server
4. Test complete workflow from user registration to event creation
5. Test admin approval flow
