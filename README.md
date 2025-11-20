# 🎓 SSAEMS - Smart Subject Allocation & Elective Management System# 🎓 SSAEMS - Smart Subject Allocation & Elective Management System



[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()A comprehensive web-based system for managing student subject allocation in educational institutions using preference-based algorithms.

[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)]()

[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D4.4-green)]()## ✨ Features

[![License](https://img.shields.io/badge/license-MIT-blue)]()

### 👨‍💼 Admin Dashboard

A comprehensive web-based system for managing student subject allocation in educational institutions using preference-based CGPA algorithms.- **Subject Management**: Create, edit, and delete subjects with capacity limits

- **Student Management**: Import students via CSV, view registrations

---- **Allocation Control**: Run CGPA-based allocation algorithm

- **Faculty Assignment**: Assign faculty to subjects and sections

## 📑 Table of Contents- **Analytics**: Visual dashboards with charts and statistics

- **Historical Tracking**: View past allocation records

- [Features](#-features)- **CSV Export**: Download allocation reports

- [Technology Stack](#-technology-stack)

- [Quick Start](#-quick-start)### 👨‍🎓 Student Portal

- [Project Structure](#-project-structure)- **Preference Submission**: Select up to 5 subject preferences with priorities

- [API Documentation](#-api-documentation)- **Real-time Feedback**: Lock preferences before allocation

- [How Allocation Works](#-how-allocation-works)- **View Allocation**: See allocated subject with faculty details

- [Test Credentials](#-test-credentials)- **Change Requests**: Request subject changes after allocation

- [Deployment](#-deployment)

- [Security Features](#-security-features)### 👨‍🏫 Faculty Dashboard

- [Troubleshooting](#-troubleshooting)- **View Assignments**: See all assigned subjects and sections

- **Student Lists**: Access student rosters for each section

---- **Section Management**: Manage multiple sections per subject



## ✨ Features## 🛠️ Technology Stack



### 👨‍💼 Admin Dashboard### Frontend

- **Subject Management**: Create, edit, and delete subjects with capacity limits and registration thresholds- **React 18** - UI library

- **Student Management**: Import students via CSV (bulk upload), view registrations, manage student data- **Material-UI v5** - Component library

- **Allocation Control**: Run CGPA-based allocation algorithm with multi-round processing- **Chart.js** - Data visualization

- **Faculty Assignment**: Assign faculty members to subjects and sections- **React Router v7** - Navigation

- **Analytics Dashboard**: Visual dashboards with real-time charts and statistics- **Axios** - HTTP client

- **Historical Tracking**: View and export past allocation records

- **CSV Export**: Download allocation reports, student lists, and analytics### Backend

- **Filtering System**: Filter subjects by year, semester, offered status- **Node.js** - Runtime environment

- **Express.js** - Web framework

### 👨‍🎓 Student Portal- **MongoDB** - Database

- **Preference Submission**: Select up to 5 subject preferences with priority ranking- **Mongoose** - ODM

- **Real-time Validation**: Instant feedback on preference selections- **JWT** - Authentication

- **Lock Preferences**: Finalize preferences before allocation deadline- **Bcrypt** - Password hashing

- **View Allocation**: See allocated subject with section and faculty details- **Winston** - Logging

- **Change Requests**: Request subject changes after allocation (if enabled)

- **Dashboard**: Personal dashboard with allocation status and important notifications## 📋 Prerequisites



### 👨‍🏫 Faculty Dashboard- Node.js 14+ and npm

- **View Assignments**: See all assigned subjects and sections- MongoDB 4.4+ (local or Atlas)

- **Student Lists**: Access detailed student rosters for each section- Git

- **Section Management**: Manage multiple sections per subject

- **Export Options**: Download student lists as CSV## 🚀 Quick Start



---### 1. Clone Repository

```bash

## 🛠️ Technology Stackgit clone <your-repo-url>

cd SSAEMS

### Frontend```

- **React 18.2.0** - Modern UI library with hooks

- **Material-UI v5.14.18** - Comprehensive component library### 2. Backend Setup

- **Chart.js 4.4.0** - Interactive data visualization```bash

- **React Router v7.9.5** - Client-side routingcd backend

- **Axios 1.4.0** - HTTP client for API callsnpm install

cp .env.example .env

### Backend# Edit .env with your MongoDB URI and JWT secret

- **Node.js 14+** - JavaScript runtime environmentnpm run seed  # Create admin user and sample data

- **Express.js 4.18.2** - Fast web frameworknpm start     # Start on port 5050

- **MongoDB 4.4+** - NoSQL database```

- **Mongoose 7.3.1** - MongoDB ODM

- **JWT (jsonwebtoken 9.0.0)** - Secure authentication### 3. Frontend Setup

- **Bcrypt.js 2.4.3** - Password hashing```bash

- **Winston 3.9.0** - Production logging with file rotationcd ../frontend

- **Helmet 8.1.0** - Security headers middlewarenpm install

- **express-rate-limit 8.2.1** - API rate limitingnpm start     # Start on port 3000

```

### DevOps

- **Docker** - Containerization support### 4. Access Application

- **PM2** - Process manager for Node.js with cluster mode- **Frontend**: http://localhost:3000

- **Git** - Version control- **Backend API**: http://localhost:5050

- **Admin Login**: admin@example.com / admin123

---

## 📦 Project Structure

## 🚀 Quick Start

```

### PrerequisitesSSAEMS/

- **Node.js** 14+ and npm├── backend/

- **MongoDB** 4.4+ (local or MongoDB Atlas)│   ├── config/          # Database & JWT config

- **Git**│   ├── controllers/     # Request handlers

│   ├── models/          # Mongoose schemas

### 1. Clone Repository│   ├── routes/          # API routes

```bash│   ├── middleware/      # Auth & error handling

git clone https://github.com/Purnima-sai/Smart_Subject_Allocator.git│   ├── utils/           # Helper functions

cd SSAEMS│   ├── scripts/         # Seed & utility scripts

```│   ├── server.js        # Entry point

│   └── .env            # Environment variables

### 2. Backend Setup├── frontend/

```bash│   ├── src/

cd backend│   │   ├── components/  # Reusable components

npm install│   │   ├── pages/       # Page components

│   │   │   ├── admin/   # Admin dashboard

# Copy environment template│   │   │   ├── student/ # Student portal

cp .env.example .env│   │   │   ├── faculty/ # Faculty dashboard

│   │   │   └── auth/    # Login/Signup

# Edit .env file with your configuration│   │   ├── App.js       # Main app component

# Required: MONGO_URI, JWT_SECRET│   │   └── index.js     # Entry point

│   └── package.json

# Seed database with admin user and sample data└── README.md

npm run seed```



# Start backend server## 🔑 Default Credentials

npm run dev          # Development mode (port 5050)

# ORAfter running `npm run seed`:

npm start            # Production mode

```| Role    | Email               | Password   |

|---------|---------------------|------------|

### 3. Frontend Setup| Admin   | admin@example.com   | admin123   |

```bash| Student | 231FA0001@example.com | Pass@123 |

cd ../frontend| Faculty | faculty1@example.com | Pass@123  |

npm install

**⚠️ Change admin password immediately in production!**

# Start development server

npm start            # Starts on port 3000## 📚 API Documentation

```

### Authentication

### 4. Access Application- `POST /api/auth/signup` - Register new user

- **Frontend**: http://localhost:3000- `POST /api/auth/login` - Login and get JWT token

- **Backend API**: http://localhost:5050- `GET /api/auth/profile` - Get user profile (protected)

- **Admin Login**: 

  - Email: `admin@example.com`### Admin Routes (Protected)

  - Password: `admin123`- `GET /api/admin/subjects` - Get all subjects

  - ⚠️ **Change this password immediately in production!**- `POST /api/admin/subjects` - Create subject

- `PUT /api/admin/subjects/:id` - Update subject

---- `DELETE /api/admin/subjects/:id` - Delete subject

- `GET /api/admin/registered-electives` - Get student registrations

## 📦 Project Structure- `POST /api/admin/run-allocation` - Run allocation algorithm

- `POST /api/admin/allocate-faculty` - Assign faculty

```- `GET /api/admin/export-allocation-csv` - Export allocations

SSAEMS/

├── backend/                    # Backend Node.js application### Student Routes (Protected)

│   ├── config/                # Configuration files- `GET /api/student/profile` - Get student profile

│   │   ├── db.js             # MongoDB connection- `POST /api/student/preferences` - Submit preferences

│   │   └── jwt.js            # JWT configuration- `GET /api/student/allocation` - Get allocated subject

│   ├── controllers/           # Request handlers- `POST /api/student/request-change` - Request subject change

│   │   ├── adminController.js

│   │   ├── allocationController.js### Faculty Routes (Protected)

│   │   ├── authController.js- `GET /api/faculty/allocations` - Get faculty assignments

│   │   ├── facultyController.js- `GET /api/faculty/students` - Get student lists

│   │   ├── studentController.js

│   │   └── subjectController.js## 🧮 Allocation Algorithm

│   ├── models/                # Mongoose schemas

│   │   ├── User.js           # User authenticationThe system uses a **CGPA-based greedy algorithm**:

│   │   ├── Student.js        # Student details & preferences

│   │   ├── Faculty.js        # Faculty information1. Sort students by CGPA (descending)

│   │   ├── Subject.js        # Subject details2. For each student:

│   │   ├── Allocation.js     # Allocation results   - Check preferences in order (Priority 1-5)

│   │   ├── AllocationSnapshot.js  # Historical records   - Allocate to first available subject with capacity

│   │   ├── FacultyAllocation.js   # Faculty assignments   - Decrease subject capacity

│   │   └── ChangeRequest.js  # Student change requests3. Track unallocated students

│   ├── routes/                # API routes

│   │   ├── authRoutes.js     # Authentication endpoints**Features:**

│   │   ├── adminRoutes.js    # Admin operations- Fair allocation based on merit

│   │   ├── studentRoutes.js  # Student operations- Respects subject capacity limits

│   │   ├── facultyRoutes.js  # Faculty operations- Handles multiple sections per subject

│   │   ├── allocationRoutes.js # Allocation operations- Historical tracking of all allocations

│   │   └── subjectRoutes.js  # Subject management

│   ├── middleware/            # Express middleware## 📊 Database Schema

│   │   ├── authMiddleware.js # JWT verification

│   │   ├── roleMiddleware.js # Role-based access control### Collections

│   │   └── errorHandler.js   # Global error handler- **users** - Authentication (email, password, role)

│   ├── utils/                 # Helper functions- **students** - Student profiles (rollNumber, cgpa, preferences)

│   │   ├── allocationAlgorithm.js  # CGPA-based allocation- **subjects** - Subject details (code, title, capacity, year, semester)

│   │   ├── multiRoundAllocation.js # Multi-round processing- **allocations** - Student-subject allocations

│   │   ├── csvHandler.js     # CSV import/export- **faculty** - Faculty profiles

│   │   ├── csvParser.js      # CSV parsing utilities- **facultyallocations** - Faculty-subject-section assignments

│   │   ├── pdfGenerator.js   # PDF report generation- **allocationsnapshots** - Historical allocation records

│   │   ├── reportGenerator.js # Report creation- **requests** - Student change requests

│   │   ├── emailService.js   # Email notifications

│   │   └── logger.js         # Winston logger## 🔐 Environment Variables

│   ├── scripts/               # Utility scripts

│   │   └── seed.js           # Database seedingCreate `backend/.env`:

│   ├── tests/                 # Test files

│   ├── data/                  # Data exports```env

│   ├── logs/                  # Application logsMONGO_URI=mongodb://127.0.0.1:27017/ssaems

│   ├── uploads/               # File uploadsJWT_SECRET=your-super-secret-jwt-key-min-32-chars

│   ├── .env                   # Environment variables (not in git)PORT=5050

│   ├── .env.example           # Environment templateEMAIL_USER=your-email@gmail.com  # Optional

│   ├── .gitignore            # Git ignore rulesEMAIL_PASS=your-app-password     # Optional

│   ├── Dockerfile            # Docker configurationNODE_ENV=development

│   ├── ecosystem.config.json # PM2 configuration```

│   ├── package.json          # Backend dependencies

│   └── server.js             # Application entry point## 🧪 Testing

│

├── frontend/                  # React frontend application```bash

│   ├── public/               # Static files# Backend tests

│   ├── src/cd backend

│   │   ├── components/       # Reusable componentsnpm test

│   │   ├── pages/            # Page components

│   │   │   ├── admin/       # Admin dashboard pages# Frontend tests

│   │   │   │   └── Dashboard.js  # Main admin interfacecd frontend

│   │   │   ├── student/     # Student portal pagesnpm test

│   │   │   │   ├── PreferencePage.js```

│   │   │   │   └── Dashboard.js

│   │   │   ├── faculty/     # Faculty dashboard pages## 📦 Deployment

│   │   │   │   └── Dashboard.js

│   │   │   └── Login.js     # Login pageSee [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

│   │   ├── App.js           # Main app component

│   │   └── index.js         # React entry point**Quick steps:**

│   ├── package.json         # Frontend dependencies1. Generate strong JWT secret

│   └── .gitignore          # Git ignore rules2. Set up production MongoDB

│3. Build frontend: `npm run build`

├── docker-compose.yml        # Docker Compose configuration4. Configure reverse proxy (Nginx)

├── .gitignore               # Root git ignore5. Use PM2 for process management

├── package.json             # Root package.json (monorepo scripts)6. Set up SSL with Let's Encrypt

└── README.md                # This file

```## 🤝 Contributing



---1. Fork the repository

2. Create feature branch: `git checkout -b feature-name`

## 🔗 API Documentation3. Commit changes: `git commit -m 'Add feature'`

4. Push to branch: `git push origin feature-name`

### Base URL5. Submit pull request

```

Development: http://localhost:5050## 📝 License

Production: https://your-domain.com

```This project is licensed under the MIT License.



### Authentication Endpoints## 🐛 Known Issues



#### POST `/api/auth/signup`- Email notifications not yet implemented (optional feature)

Register a new user account.- Large CSV imports may take time (working as designed)



**Request Body:**## 📞 Support

```json

{For issues and questions:

  "email": "user@example.com",- Check logs: `pm2 logs` (production) or console (development)

  "password": "securePassword123",- Verify MongoDB connection

  "role": "student",- Ensure all environment variables are set

  "name": "John Doe"- Clear browser cache if UI issues persist

}

```## 🎯 Future Enhancements



**Response:**- [ ] Email notifications for allocations

```json- [ ] Multi-round allocation support

{- [ ] Student feedback system

  "token": "jwt_token_here",- [ ] Mobile app version

  "user": {- [ ] Advanced analytics dashboard

    "id": "user_id",- [ ] Automated preference recommendations

    "email": "user@example.com",

    "role": "student"---

  }

}**Made with ❤️ for Educational Institutions**

```


#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "student",
    "name": "John Doe"
  }
}
```

### Student Endpoints

All student endpoints require authentication header:
```
Authorization: Bearer <jwt_token>
```

#### POST `/api/students/preferences`
Submit student subject preferences.

**Request Body:**
```json
{
  "preferences": [
    { "subjectId": "subject_id_1", "priority": 1 },
    { "subjectId": "subject_id_2", "priority": 2 },
    { "subjectId": "subject_id_3", "priority": 3 }
  ]
}
```

#### GET `/api/students/allocation`
Get student's allocation result.

**Response:**
```json
{
  "allocation": {
    "subjectId": "subject_id",
    "subjectName": "Machine Learning",
    "section": "A",
    "faculty": "Dr. Smith",
    "priority": 1
  }
}
```

### Admin Endpoints

#### GET `/api/admin/subjects`
Get all subjects.

**Response:**
```json
{
  "subjects": [
    {
      "_id": "subject_id",
      "code": "CS301",
      "name": "Machine Learning",
      "capacity": 75,
      "registrationThreshold": 30,
      "year": 3,
      "semester": 1,
      "isOffered": true,
      "registeredCount": 45
    }
  ]
}
```

#### POST `/api/admin/subjects`
Create a new subject.

**Request Body:**
```json
{
  "code": "CS301",
  "name": "Machine Learning",
  "capacity": 75,
  "registrationThreshold": 30,
  "year": 3,
  "semester": 1
}
```

#### POST `/api/admin/run-allocation`
Run the allocation algorithm.

**Response:**
```json
{
  "success": true,
  "message": "Allocation completed successfully",
  "stats": {
    "totalStudents": 150,
    "allocatedStudents": 145,
    "unallocatedStudents": 5
  }
}
```

#### POST `/api/admin/import-students`
Import students from CSV file.

**Request:**
- Content-Type: `multipart/form-data`
- File field name: `file`
- File format: CSV with columns: rollNumber, name, email, year, semester, cgpa

#### GET `/api/admin/registered-electives`
Get all students with their preferences.

**Query Parameters:**
- `year` (optional): Filter by year
- `semester` (optional): Filter by semester

### Faculty Endpoints

#### GET `/api/faculty/allocations`
Get faculty's assigned subjects and student lists.

**Response:**
```json
{
  "allocations": [
    {
      "subjectId": "subject_id",
      "subjectName": "Machine Learning",
      "section": "A",
      "students": [
        {
          "rollNumber": "CS123",
          "name": "John Doe",
          "email": "john@example.com",
          "cgpa": 8.5
        }
      ]
    }
  ]
}
```

### Rate Limiting

- **General API**: 100 requests per 15 minutes (production)
- **Auth Routes**: 5 attempts per 15 minutes (production)
- Development mode has relaxed limits

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 🧮 How Allocation Works

### CGPA-Based Allocation Algorithm

The system uses a **priority-based CGPA allocation algorithm** that ensures fairness and transparency.

### Algorithm Steps

1. **Sort Students by CGPA** (Descending)
   - Highest CGPA gets first priority
   - Ensures merit-based allocation

2. **Process Each Student in Order**
   - Check their preferences in priority order (1st → 5th)
   - Allocate to first available subject

3. **Subject Availability Check**
   - Subject must be offered (met registration threshold)
   - Must have available seats in current section
   - Sections are created when capacity is reached

4. **Allocation Result**
   - Student gets their highest priority available subject
   - If no preferences available, student remains unallocated
   - Unallocated students are tracked for manual intervention

### Visual Example

**Setup:**
```
Students (sorted by CGPA):
1. Alice   (CGPA: 9.8) → Preferences: [ML, AI, Cloud, IoT, Blockchain]
2. Bob     (CGPA: 9.5) → Preferences: [ML, Cloud, AI, DS, IoT]
3. Charlie (CGPA: 9.2) → Preferences: [AI, ML, Cloud, IoT, DS]

Subjects:
- ML (Machine Learning): 75 seats
- AI (Artificial Intelligence): 75 seats
- Cloud (Cloud Computing): 75 seats
- IoT (Internet of Things): 75 seats
```

**Allocation Process:**

**Round 1 - Alice (CGPA: 9.8):**
```
✓ Check Priority 1: ML → Available (75 seats)
  → ALLOCATED: Alice → ML Section A
  → Remaining: ML = 74 seats
```

**Round 2 - Bob (CGPA: 9.5):**
```
✓ Check Priority 1: ML → Available (74 seats)
  → ALLOCATED: Bob → ML Section A
  → Remaining: ML = 73 seats
```

**Round 3 - Charlie (CGPA: 9.2):**
```
✓ Check Priority 1: AI → Available (75 seats)
  → ALLOCATED: Charlie → AI Section A
  → Remaining: AI = 74 seats
```

### Multi-Section Handling

When a subject reaches its capacity (e.g., 75 students), a new section is automatically created:

```
ML Section A: 75 students (FULL)
ML Section B: Opens for next students
```

### Edge Cases Handled

1. **No preferences met** → Student marked as unallocated
2. **Subject below threshold** → Subject not offered, skipped in allocation
3. **Tied CGPA** → Processed in order received (first-come basis)
4. **Duplicate preferences** → Validation prevents duplicates
5. **Incomplete preferences** → Students can submit 1-5 preferences

---

## 🔐 Test Credentials

### Admin Account
```
Email: admin@example.com
Password: admin123
```
⚠️ **Change this password immediately in production!**

### Sample Student Accounts
**All student accounts use password:** `password123`

#### High CGPA Students (Should get first choice)
```
1. student2@college.edu    - CGPA: 9.70 (Year 4, Sem 1) ⭐
2. student64@college.edu   - CGPA: 9.60 (Year 1, Sem 1) ⭐
3. student9@college.edu    - CGPA: 9.47 (Year 3, Sem 2) ⭐
4. student18@college.edu   - CGPA: 9.38 (Year 4, Sem 1) ⭐
5. student46@college.edu   - CGPA: 9.36 (Year 4, Sem 2) ⭐
```

#### Medium CGPA Students
```
6. student22@college.edu   - CGPA: 8.23 (Year 1, Sem 2)
7. student71@college.edu   - CGPA: 8.01 (Year 2, Sem 1)
8. student10@college.edu   - CGPA: 7.94 (Year 2, Sem 2)
```

#### Lower CGPA Students (Test edge cases)
```
9. student125@college.edu  - CGPA: 5.13 (Year 1, Sem 1)
10. student15@college.edu  - CGPA: 5.17 (Year 4, Sem 1)
```

### Sample Faculty Accounts
**All faculty accounts use password:** `password123`

```
1. faculty1@college.edu    - Dr. Sharma
2. faculty2@college.edu    - Prof. Patel
3. faculty3@college.edu    - Dr. Kumar
```

### Testing Scenarios

#### Scenario 1: High CGPA Priority Test
```bash
1. Login as student2@college.edu (CGPA: 9.70)
2. Submit preferences: ML (1st), AI (2nd), Cloud (3rd)
3. Login as student125@college.edu (CGPA: 5.13)
4. Submit same preferences: ML (1st), AI (2nd), Cloud (3rd)
5. Run allocation as admin
6. Verify: student2 gets ML, student125 gets lower priority or unallocated
```

#### Scenario 2: Subject Capacity Test
```bash
1. Import 100 students via CSV
2. Have all students select same subject as 1st preference
3. Run allocation
4. Verify: First 75 students get allocated (Section A full)
5. Next 25 students get their 2nd preference or create Section B
```

---

## 🚀 Deployment

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/ssaems
# For production, use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ssaems

# JWT Secret (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=c6d83eaf712dbf88bc3e2595db5d53265e4357eeba9d9b7619bad9036fd1a416b46ca4d2f56256e8a5e838694654cc934d67067b4a0f031915b72241e4f96499

# Server Configuration
PORT=5050
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Email Configuration (Optional)
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password
```

### Option 1: Traditional VPS Deployment

#### 1. Install Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 14+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/Purnima-sai/Smart_Subject_Allocator.git
cd SSAEMS

# Setup backend
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values

# Seed database
npm run seed

# Start with PM2
pm2 start ecosystem.config.json --env production
pm2 save
pm2 startup
```

#### 3. Build and Serve Frontend
```bash
cd ../frontend
npm install
npm run build

# Serve with nginx or serve package
sudo npm install -g serve
serve -s build -l 3000
```

### Option 2: Docker Deployment

#### 1. Using Docker Compose (Easiest)
```bash
# Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Start all services
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5050
# - MongoDB: localhost:27017
```

#### 2. Manual Docker Commands
```bash
# Build backend
cd backend
docker build -t ssaems-backend .

# Build frontend
cd ../frontend
docker build -t ssaems-frontend .

# Run MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:7

# Run backend
docker run -d --name ssaems-backend \
  -p 5050:5050 \
  --link mongodb:mongo \
  --env-file .env \
  ssaems-backend

# Run frontend
docker run -d --name ssaems-frontend \
  -p 3000:80 \
  ssaems-frontend
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login and create app
heroku login
heroku create ssaems-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your_jwt_secret_here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run seed script
heroku run npm run seed
```

#### Railway / Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push
4. Add MongoDB database addon

### Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Set up database backups
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring (PM2 logs, New Relic, etc.)
- [ ] Configure email service
- [ ] Test all user flows
- [ ] Set up domain and DNS
- [ ] Enable production CORS settings
- [ ] Review and test security headers

---

## 🔒 Security Features

### ✅ Implemented Security Measures

#### 1. Strong JWT Authentication
- **128-character cryptographic secret**
- Token expiration (24 hours default)
- Secure token storage in localStorage
- Token validation on every protected route

#### 2. CORS Protection
- **Environment-based origin whitelist**
- Production domain restrictions
- Credentials support enabled
- Preflight request handling

**Configuration:**
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:3000', 'http://localhost:3001'];
```

#### 3. Rate Limiting
- **API Routes**: 100 requests per 15 minutes
- **Auth Routes**: 5 attempts per 15 minutes (prevents brute force)
- Configurable per environment
- Standard rate limit headers

#### 4. Security Headers (Helmet)
Protects against:
- **XSS** (Cross-Site Scripting)
- **Clickjacking** (X-Frame-Options)
- **MIME sniffing** (X-Content-Type-Options)
- **DNS prefetch control**
- **HSTS** (HTTP Strict Transport Security)
- **IE No Open** (X-Download-Options)

#### 5. Password Security
- **Bcrypt hashing** with 10 salt rounds
- No plaintext passwords stored
- Password validation on input

#### 6. MongoDB Security
- **Mongoose schema validation**
- Input sanitization
- Query parameterization (prevents injection)
- Connection string encryption

#### 7. Error Handling
- **Global error handler middleware**
- No sensitive data in error responses
- Production vs development error messages
- Error logging with Winston

#### 8. Logging System
- **Winston logger** with file rotation
- Error logs: `backend/logs/error.log`
- Combined logs: `backend/logs/combined.log`
- 5MB max file size with 5-file rotation
- Environment-based log levels

### Security Best Practices

1. **Never commit `.env` files** → Added to `.gitignore`
2. **Change default passwords immediately**
3. **Use HTTPS in production** (Let's Encrypt recommended)
4. **Regular dependency updates** → Run `npm audit fix`
5. **Database backups** → Schedule daily backups
6. **Monitor logs** → Check `backend/logs/` regularly
7. **Rate limit monitoring** → Track failed login attempts

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:integration   # Integration tests
```

### Manual Testing

#### Admin Flow
1. Login as admin@example.com
2. Create subjects (CS301, CS302, etc.)
3. Import students via CSV
4. Verify student registrations
5. Run allocation algorithm
6. Export allocation report
7. Assign faculty to sections

#### Student Flow
1. Login with student credentials
2. View available subjects
3. Submit 5 preferences with priorities
4. Lock preferences
5. View allocation result
6. Request change (if needed)

#### Faculty Flow
1. Login with faculty credentials
2. View assigned subjects
3. Access student lists
4. Export class roster

### Test Data

Sample CSV files are included in `backend/data/`:
- `sample_students.csv` - Student import template
- `Generated_Student_Excel_Dataset.csv` - 200 sample students

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Check connection string in .env
MONGO_URI=mongodb://127.0.0.1:27017/ssaems
```

#### 2. Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5050`

**Solutions:**
```bash
# Find process using port 5050
lsof -i :5050
# or on Windows:
netstat -ano | findstr :5050

# Kill the process
kill -9 <PID>

# Or change PORT in .env
PORT=5051
```

#### 3. JWT Token Invalid
**Error:** `JsonWebTokenError: invalid signature`

**Solutions:**
- Clear browser localStorage
- Regenerate JWT_SECRET in `.env`
- Restart backend server
- Re-login to get new token

#### 4. CORS Errors
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solutions:**
- Verify FRONTEND_URL in backend `.env`
- Check CORS configuration in `server.js`
- Ensure frontend is on allowed origin
```env
FRONTEND_URL=http://localhost:3000
```

#### 5. CSV Import Fails
**Error:** `Invalid CSV format`

**Solutions:**
- Check CSV columns match template:
  ```
  rollNumber,name,email,year,semester,cgpa
  ```
- Remove BOM characters (open in Notepad++, Encoding → UTF-8)
- Ensure no empty rows
- Check for special characters in data

#### 6. Allocation Not Working
**Checklist:**
- [ ] Students have submitted preferences
- [ ] Subjects are marked as offered
- [ ] Subject capacities are set correctly
- [ ] Registration threshold is met
- [ ] Check logs: `backend/logs/error.log`

#### 7. Rate Limit Blocking Requests
**Error:** `Too many requests, please try again later`

**Solutions:**
```javascript
// Increase limits in development
// backend/server.js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 1000 // Increased for dev
});
```

### Debug Mode

Enable detailed logging:
```env
# backend/.env
LOG_LEVEL=debug
NODE_ENV=development
```

View logs:
```bash
# Tail error logs
tail -f backend/logs/error.log

# Tail all logs
tail -f backend/logs/combined.log

# PM2 logs
pm2 logs ssaems-backend
```

### Getting Help

1. **Check logs**: `backend/logs/error.log`
2. **Enable debug mode**: Set `LOG_LEVEL=debug`
3. **Test API with Postman**: Import collection from `backend/postman_collection_ssaems.json`
4. **Check GitHub Issues**: [Repository Issues](https://github.com/Purnima-sai/Smart_Subject_Allocator/issues)

---

## 📚 Additional Information

### Database Schema

#### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (admin/student/faculty),
  name: String,
  createdAt: Date
}
```

#### Student Model
```javascript
{
  userId: ObjectId (ref: User),
  rollNumber: String (unique),
  name: String,
  email: String,
  year: Number,
  semester: Number,
  cgpa: Number,
  preferences: [{
    subjectId: ObjectId,
    priority: Number
  }],
  preferencesLocked: Boolean
}
```

#### Subject Model
```javascript
{
  code: String (unique),
  name: String,
  capacity: Number,
  registrationThreshold: Number,
  year: Number,
  semester: Number,
  isOffered: Boolean,
  registeredCount: Number,
  sections: [{
    section: String,
    capacity: Number,
    currentCount: Number
  }]
}
```

#### Allocation Model
```javascript
{
  studentId: ObjectId,
  subjectId: ObjectId,
  section: String,
  priority: Number,
  allocatedAt: Date
}
```

### Performance Considerations

- **Indexing**: MongoDB indexes on rollNumber, email, year, semester
- **Pagination**: Large lists use pagination (default: 50 items/page)
- **Caching**: localStorage caching for UI state
- **Lazy Loading**: Components load on demand
- **Compression**: Gzip compression on API responses

### Future Enhancements

- [ ] Email notifications for allocation results
- [ ] SMS notifications for important updates
- [ ] Automated waitlist management
- [ ] Student preference analytics
- [ ] Subject recommendation engine
- [ ] Multi-round allocation for unallocated students
- [ ] Change request approval workflow
- [ ] Real-time allocation progress updates
- [ ] Mobile application (React Native)
- [ ] PDF report generation for individual students

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- **Purnima Sai** - Lead Developer
- GitHub: [@Purnima-sai](https://github.com/Purnima-sai)

---

## 🙏 Acknowledgments

- Material-UI for the component library
- MongoDB for the database solution
- React team for the amazing framework
- All contributors and testers

---

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/Purnima-sai/Smart_Subject_Allocator/issues)
- **Email**: support@ssaems.com
- **Documentation**: This README

---

**Last Updated:** November 20, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
