# SyncUp - Intelligent Social Calendar

SyncUp is an intelligent social calendar platform for university students that automates academic and social scheduling with automatic timetable integration, smart availability detection, and optimization algorithms.

## 🎯 Features

### ✅ Implemented

1. **Database Schema**
   - User management with courses, events, and preferences
   - Friend system with status management (pending, accepted, blocked)
   - Event system supporting multiple types (class, custom, assessment, study, social)
   - Assessment tracking with automatic calendar integration
   - Group events with participant management
   - Availability blocks for caching free time

2. **DevSoc API Integration**
   - Automatic timetable fetching from DevSoc GraphQL API
   - Course schedule synchronization
   - Room availability lookup
   - Integration with UNSW course data

3. **Availability Detection Algorithm**
   - Find common free time slots among multiple users
   - Merge overlapping intervals
   - Smart ranking based on preferences
   - Filter by day of week
   - Generate availability blocks for caching

4. **GraphQL API**
   - Comprehensive query support for users, events, courses, friends, assessments
   - Group availability finding
   - Timetable synchronization mutations
   - Friend request management
   - Assessment CRUD operations
   - Group event creation and management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (running in Docker)
- npm or pnpm

### Installation

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate --schema=./packages/db/prisma/schema.prisma
   ```

4. **Run migrations** (if needed):
   ```bash
   npx prisma migrate dev --schema=./packages/db/prisma/schema.prisma
   ```

5. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This starts:
   - **Frontend**: http://localhost:3000
   - **GraphQL API**: http://localhost:4000/graphql

## 📡 API Usage

### GraphQL Endpoint

The GraphQL playground is available at `http://localhost:4000/graphql`

### Example Queries

#### 1. Create a User
```graphql
mutation {
  createUser(email: "student@unsw.edu.au", name: "John Doe") {
    id
    name
    email
  }
}
```

#### 2. Sync Timetable from DevSoc API
```graphql
mutation {
  syncTimetable(
    userId: "user_id_here"
    courseCode: "COMP1531"
    term: "25T1"
  ) {
    success
    eventsCreated
    message
  }
}
```

#### 3. Find Group Availability
```graphql
query {
  findGroupAvailability(
    userIds: ["user1_id", "user2_id", "user3_id"]
    startDate: "2025-10-01T00:00:00Z"
    endDate: "2025-10-07T23:59:59Z"
    minDuration: 60
  ) {
    start
    end
    duration
  }
}
```

#### 4. Get User's Events
```graphql
query {
  events(
    userId: "user_id_here"
    startDate: "2025-10-01T00:00:00Z"
    endDate: "2025-10-07T23:59:59Z"
  ) {
    id
    title
    type
    startTime
    endTime
    location
    course {
      code
      name
    }
  }
}
```

#### 5. Create Assessment
```graphql
mutation {
  createAssessment(input: {
    userId: "user_id_here"
    courseId: "course_id_here"
    title: "Assignment 1"
    description: "Complete the project"
    dueDate: "2025-10-15T23:59:00Z"
    weight: 20
  }) {
    id
    title
    dueDate
    course {
      code
      name
    }
  }
}
```

#### 6. Send Friend Request
```graphql
mutation {
  sendFriendRequest(
    userId: "user1_id"
    friendId: "user2_id"
  ) {
    userId
    friendId
    status
  }
}
```

#### 7. Create Group Event
```graphql
mutation {
  createGroupEvent(input: {
    title: "Study Session"
    description: "Group study for COMP1531 exam"
    createdBy: "user_id_here"
    startTime: "2025-10-10T14:00:00Z"
    endTime: "2025-10-10T16:00:00Z"
    location: "Library Level 2"
    participantIds: ["user1_id", "user2_id", "user3_id"]
  }) {
    id
    title
    startTime
    location
    participants {
      userId
      status
      user {
        name
        email
      }
    }
  }
}
```

## 🏗️ Architecture

### Backend (GraphQL API)

- **Framework**: Apollo Server Express
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript

#### Key Services

1. **DevsocApi Service** (`apps/server/src/services/devsocApi.ts`)
   - Fetches course schedules from DevSoc GraphQL API
   - Syncs timetable data to database
   - Handles room availability lookups

2. **Availability Service** (`apps/server/src/services/availability.ts`)
   - Implements interval merging algorithm
   - Finds common free time across multiple users
   - Ranks free slots based on preferences
   - Generates availability blocks for caching

3. **GraphQL Resolvers** (`apps/server/src/index.ts`)
   - Comprehensive CRUD operations
   - Complex queries with relationships
   - Business logic for friend requests, assessments, group events

### Database Schema

#### Core Models
- `User`: User accounts with authentication
- `Course`: University courses
- `UserCourse`: Many-to-many relationship between users and courses
- `Event`: Calendar events (classes, custom, assessments, study, social)
- `Friendship`: Friend relationships with status tracking
- `Assessment`: Course assessments with due dates
- `GroupEvent`: Multi-user events
- `GroupEventParticipant`: Participant tracking for group events
- `OptimizerPreference`: User preferences for schedule optimization
- `AvailabilityBlock`: Cached availability data

## 🔗 DevSoc API Integration

SyncUp integrates with the DevSoc GraphQL API to fetch UNSW course and room data:

- **Endpoint**: `https://graphql.csesoc.app/v1/graphql`
- **Data Available**:
  - Course schedules and class times
  - Building and room information
  - Room bookings and availability

### Example DevSoc API Query

```graphql
query GetCourseClasses($courseCode: String!, $term: String!) {
  classes(where: { 
    course: { code: { _eq: $courseCode } }
    term: { _eq: $term }
  }) {
    id
    course {
      code
      name
    }
    type
    day
    start_time
    end_time
    location
  }
}
```

## 📊 Availability Detection Algorithm

The core algorithm for finding common free time:

1. **Merge all busy slots** from all users
2. **Sort intervals** by start time
3. **Merge overlapping intervals** using sweep line algorithm
4. **Find gaps** between merged intervals
5. **Filter by minimum duration**
6. **Rank slots** based on preferences (time of day, day of week, etc.)

### Complexity
- Time: O(n log n) where n is the total number of events
- Space: O(n) for storing merged intervals

## 🎨 Frontend (To Be Implemented)

The frontend will include:

1. **Calendar View** - Interactive calendar with event display
2. **Availability Finder** - Select friends and find common free time
3. **Course Manager** - Enroll in courses and sync timetables
4. **Friend System** - Send/accept friend requests
5. **Assessment Tracker** - Track upcoming assessments and deadlines
6. **Group Events** - Create and manage group study sessions

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devsoc_hackathon?schema=public"

# DevSoc API
DEVSOC_API_URL="https://graphql.csesoc.app/v1/graphql"

# Server
PORT=4000
```

## 📝 Development

### Adding New Features

1. Update Prisma schema in `packages/db/prisma/schema.prisma`
2. Run migration: `npx prisma migrate dev --schema=./packages/db/prisma/schema.prisma`
3. Generate client: `npx prisma generate --schema=./packages/db/prisma/schema.prisma`
4. Add resolvers to `apps/server/src/index.ts`
5. Update frontend components

### Testing GraphQL API

Use the GraphQL Playground at `http://localhost:4000/graphql` to:
- Explore the schema
- Test queries and mutations
- View documentation
- Debug responses

## 🚧 Roadmap

### Phase 1: MVP (✅ Completed)
- [x] Database schema
- [x] DevSoc API integration
- [x] Availability detection algorithm
- [x] GraphQL API with comprehensive resolvers
- [x] Friend system
- [x] Assessment tracking
- [x] Group events

### Phase 2: Frontend (In Progress)
- [ ] Calendar component with FullCalendar
- [ ] Availability finder UI
- [ ] Friend management interface
- [ ] Assessment tracker dashboard
- [ ] Course enrollment and sync UI

### Phase 3: Optimization (Planned)
- [ ] Schedule optimizer with constraint solving
- [ ] Study time recommendations
- [ ] Social goal tracking
- [ ] Notification system
- [ ] Real-time updates with WebSockets

## 🤝 Contributing

This is a hackathon project. Feel free to:
- Add new features
- Improve algorithms
- Enhance UI/UX
- Fix bugs
- Improve documentation

## 📄 License

MIT

## 🙏 Acknowledgments

- **DevSoc** for providing the UNSW data API
- **Prisma** for the excellent ORM
- **Apollo Server** for GraphQL implementation

---

**Happy Syncing! 🎉**
