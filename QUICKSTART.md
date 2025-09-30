# SyncUp Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Start PostgreSQL
```bash
docker-compose up -d
```

### Step 2: Run the Application
```bash
npm run dev
```

That's it! The app will start at:
- **Frontend**: http://localhost:3000
- **GraphQL API**: http://localhost:4000/graphql

---

## 🧪 Quick Test

### Test the GraphQL API

1. Open http://localhost:4000/graphql
2. Run this query:

```graphql
query {
  hello
}
```

You should see: `"SyncUp API - Your intelligent social calendar!"`

### Create Your First User

```graphql
mutation {
  createUser(email: "john@unsw.edu.au", name: "John Doe") {
    id
    name
    email
  }
}
```

Copy the `id` returned - you'll need it!

### Add a Custom Event

```graphql
mutation {
  createEvent(input: {
    userId: "YOUR_USER_ID_HERE"
    type: "STUDY"
    title: "Study for COMP1531"
    description: "Prepare for final exam"
    startTime: "2025-10-15T14:00:00Z"
    endTime: "2025-10-15T16:00:00Z"
    location: "Library Level 2"
  }) {
    id
    title
    startTime
    endTime
  }
}
```

### Get Your Events

```graphql
query {
  events(
    userId: "YOUR_USER_ID_HERE"
    startDate: "2025-10-01T00:00:00Z"
    endDate: "2025-10-31T23:59:59Z"
  ) {
    id
    title
    type
    startTime
    endTime
    location
  }
}
```

---

## 👥 Test Friend System

### Create Another User

```graphql
mutation {
  createUser(email: "jane@unsw.edu.au", name: "Jane Smith") {
    id
    name
  }
}
```

### Send Friend Request

```graphql
mutation {
  sendFriendRequest(
    userId: "USER1_ID"
    friendId: "USER2_ID"
  ) {
    status
  }
}
```

### Accept Friend Request

```graphql
mutation {
  acceptFriendRequest(
    userId: "USER2_ID"
    friendId: "USER1_ID"
  ) {
    status
  }
}
```

### Find Common Free Time

```graphql
query {
  findGroupAvailability(
    userIds: ["USER1_ID", "USER2_ID"]
    startDate: "2025-10-15T00:00:00Z"
    endDate: "2025-10-20T23:59:59Z"
    minDuration: 60
  ) {
    start
    end
    duration
  }
}
```

---

## 📚 Test Course Sync

### Enroll in a Course

```graphql
mutation {
  enrollCourse(
    userId: "YOUR_USER_ID"
    courseCode: "COMP1531"
    term: "25T1"
  ) {
    userId
    course {
      code
      name
    }
  }
}
```

### Sync Timetable (DevSoc API)

```graphql
mutation {
  syncTimetable(
    userId: "YOUR_USER_ID"
    courseCode: "COMP1531"
    term: "25T1"
  ) {
    success
    eventsCreated
    message
  }
}
```

**Note**: This requires the DevSoc API to have data for the specified course and term.

---

## 📝 Test Assessment Tracking

### Add an Assessment

```graphql
mutation {
  createAssessment(input: {
    userId: "YOUR_USER_ID"
    courseId: "YOUR_COURSE_ID"
    title: "Final Exam"
    description: "COMP1531 final examination"
    dueDate: "2025-11-15T09:00:00Z"
    weight: 50
  }) {
    id
    title
    dueDate
    weight
  }
}
```

This automatically creates a calendar event too!

### Get Upcoming Assessments

```graphql
query {
  upcomingAssessments(userId: "YOUR_USER_ID", days: 30) {
    id
    title
    dueDate
    weight
    course {
      code
      name
    }
  }
}
```

---

## 🎉 Test Group Events

### Create a Study Session

```graphql
mutation {
  createGroupEvent(input: {
    title: "COMP1531 Study Group"
    description: "Final exam preparation"
    createdBy: "YOUR_USER_ID"
    startTime: "2025-10-18T14:00:00Z"
    endTime: "2025-10-18T17:00:00Z"
    location: "Library Level 2, Room 201"
    participantIds: ["USER1_ID", "USER2_ID", "USER3_ID"]
  }) {
    id
    title
    location
    participants {
      status
      user {
        name
        email
      }
    }
  }
}
```

---

## 🌐 Test Frontend

1. Visit http://localhost:3000
2. Click **"Open Calendar"**
3. You'll see the calendar interface
4. Select friends and click **"Find Common Time"**

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port already in use":

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

### Database Connection Error

Make sure PostgreSQL is running:

```bash
docker-compose ps
```

If not running:

```bash
docker-compose up -d
```

### Prisma Client Not Generated

```bash
npx prisma generate --schema=./packages/db/prisma/schema.prisma
```

### Need to Reset Database?

```bash
npx prisma migrate reset --schema=./packages/db/prisma/schema.prisma
```

**Warning**: This deletes all data!

---

## 📊 Example Complete Workflow

Here's a complete workflow to test all features:

```graphql
# 1. Create users
mutation {
  user1: createUser(email: "alice@unsw.edu.au", name: "Alice") { id }
  user2: createUser(email: "bob@unsw.edu.au", name: "Bob") { id }
}

# 2. Send friend request
mutation {
  sendFriendRequest(userId: "alice_id", friendId: "bob_id") {
    status
  }
}

# 3. Accept friend request
mutation {
  acceptFriendRequest(userId: "bob_id", friendId: "alice_id") {
    status
  }
}

# 4. Add events for Alice
mutation {
  createEvent(input: {
    userId: "alice_id"
    type: "CLASS"
    title: "COMP1531 Lecture"
    startTime: "2025-10-15T10:00:00Z"
    endTime: "2025-10-15T12:00:00Z"
  }) { id }
}

# 5. Add events for Bob
mutation {
  createEvent(input: {
    userId: "bob_id"
    type: "CLASS"
    title: "MATH1081 Tutorial"
    startTime: "2025-10-15T10:00:00Z"
    endTime: "2025-10-15T11:00:00Z"
  }) { id }
}

# 6. Find when both are free
query {
  findGroupAvailability(
    userIds: ["alice_id", "bob_id"]
    startDate: "2025-10-15T00:00:00Z"
    endDate: "2025-10-15T23:59:59Z"
    minDuration: 60
  ) {
    start
    end
    duration
  }
}

# 7. Create group study session
mutation {
  createGroupEvent(input: {
    title: "Study Together"
    createdBy: "alice_id"
    startTime: "2025-10-15T14:00:00Z"
    endTime: "2025-10-15T16:00:00Z"
    participantIds: ["alice_id", "bob_id"]
  }) {
    id
    title
    participants {
      user { name }
      status
    }
  }
}
```

---

## 🎯 Next Steps

1. **Explore the API**: Try all the queries and mutations in the GraphQL playground
2. **Test the Frontend**: Visit the calendar page and interact with the UI
3. **Read the Docs**: Check out `SYNCUP_README.md` for full documentation
4. **Customize**: Add your own features and improvements!

---

## 📚 Additional Resources

- **GraphQL Playground**: http://localhost:4000/graphql
- **Full Documentation**: `SYNCUP_README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **DevSoc API Docs**: `READMEfordevsocapi.md`

---

Happy coding! 🚀
