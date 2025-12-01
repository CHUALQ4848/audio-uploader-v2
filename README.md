# Audio Hosting Application

A full-stack audio hosting application with React frontend, Node.js/Express backend, PostgreSQL database, and AWS S3 storage.

## Features

### Frontend

- ✅ User authentication (login/register)
- ✅ Upload audio files with metadata (title, description, category)
- ✅ View and filter uploaded audio files
- ✅ Audio playback with controls
- ✅ User account management (update/delete)
- ✅ Responsive Material-UI design

### Backend

- ✅ RESTful API with Express.js
- ✅ JWT-based authentication
- ✅ PostgreSQL database with Prisma ORM
- ✅ AWS S3 integration for audio storage
- ✅ Pre-signed URLs for secure audio playback
- ✅ Input validation and error handling
- ✅ File upload with Multer

## Tech Stack

- **Frontend**: React.js 18, Material-UI, Axios, React Router
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Storage**: AWS S3
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- AWS account with S3 bucket configured
- AWS credentials (Access Key ID and Secret Access Key)

## Quick Start

### 1. Clone and Setup

```bash
cd /Users/chualouis/Documents/Personal/react/audio-uploader
```

### 2. Configure Environment Variables

Copy the example environment files and update with your values:

```bash
# Root directory
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Update `.env` with your AWS credentials:

```env
JWT_SECRET=your-secret-key-change-this-in-production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
```

### 3. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### 4. Create Default User

After starting the services, create a default demo user by running:

```bash
# Enter the backend container
docker exec -it audio-uploader-backend sh

# Run Prisma Studio or create user via API
# Or use the Register page in the frontend
```

Alternatively, register a new user through the frontend at http://localhost:3000

## Default Credentials

For testing purposes, you can create a demo user:

- **Username**: demo
- **Password**: demo123

## Audio Categories

The application supports the following audio categories:

- Music
- Podcast
- Audiobook
- Sound Effect
- Voice Recording
- Other

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users/me` - Get current user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Audio

- `POST /api/audio/upload` - Upload audio file
- `GET /api/audio` - Get all user's audio files
- `GET /api/audio/:id` - Get single audio file
- `GET /api/audio/:id/play` - Get presigned URL for playback
- `DELETE /api/audio/:id` - Delete audio file

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma studio
```

## Project Structure

```
audio-uploader/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── multer.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── audio.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── audio.routes.js
│   │   ├── services/
│   │   │   └── s3.service.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Upload.js
│   │   │   └── Account.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Security Notes

1. **JWT Secret**: Change the default JWT_SECRET in production
2. **AWS Credentials**: Never commit AWS credentials to version control
3. **Database**: Use strong passwords for PostgreSQL in production
4. **CORS**: Configure CORS properly for production environment
5. **File Upload**: Maximum file size is 50MB (configurable in multer.js)

## Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav)
- OGG (audio/ogg)
- MP4 Audio (audio/mp4)
- AAC (audio/aac)
- FLAC (audio/flac)
- WebM Audio (audio/webm)

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL container is running: `docker ps`
- Check database logs: `docker logs audio-uploader-db`

### S3 Upload Errors

- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure bucket region matches AWS_REGION

### CORS Issues

- Frontend must proxy to backend or configure CORS properly
- Check nginx.conf for API proxy settings

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
