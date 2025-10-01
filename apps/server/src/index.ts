import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer, gql } from 'apollo-server-express'
import { prisma } from '@devsoc/db'
import { AvailabilityFinder } from './services/availability.js'
import { fetchCourseSchedules, syncTimetableToDatabase, searchCourses } from './services/devsocApi.js'
import { findOptimalClassSchedule, calculateOverlapStats } from './services/classMatching.js'

const typeDefs = gql`
  type Query {
    hello: String
    
    # User queries
    user(id: ID!): User
    users: [User!]!
    
    # Event queries
    events(userId: ID!, startDate: String, endDate: String): [Event!]!
    event(id: ID!): Event
    
    # Availability queries
    findGroupAvailability(
      userIds: [ID!]!
      startDate: String!
      endDate: String!
      minDuration: Int
    ): [TimeSlot!]!
    
    # Course queries
    courses: [Course!]!
    userCourses(userId: ID!): [UserCourse!]!
    searchCourses(searchTerm: String!, term: String): [CourseSearchResult!]!
    
    # Friendship queries
    friends(userId: ID!): [Friendship!]!
    friendRequests(userId: ID!): [Friendship!]!
    
    # Assessment queries
    assessments(userId: ID!): [Assessment!]!
    upcomingAssessments(userId: ID!, days: Int): [Assessment!]!
    
    # Group events
    groupEvents(userId: ID!): [GroupEvent!]!
  }
  
  type Mutation {
    # User mutations
    createUser(email: String!, name: String!): User!
    
    # Event mutations
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    
    # Course mutations
    enrollCourse(userId: ID!, courseCode: String!, term: String!): UserCourse!
    syncTimetable(userId: ID!, courseCode: String!, term: String!): SyncResult!
    
    # Friendship mutations
    sendFriendRequest(userId: ID!, friendId: ID!): Friendship!
    acceptFriendRequest(userId: ID!, friendId: ID!): Friendship!
    rejectFriendRequest(userId: ID!, friendId: ID!): Boolean!
    
    # Assessment mutations
    createAssessment(input: CreateAssessmentInput!): Assessment!
    updateAssessment(id: ID!, input: UpdateAssessmentInput!): Assessment!
    deleteAssessment(id: ID!): Boolean!
    
    # Group event mutations
    createGroupEvent(input: CreateGroupEventInput!): GroupEvent!
    inviteToGroupEvent(groupEventId: ID!, userId: ID!): GroupEventParticipant!
    respondToGroupEvent(groupEventId: ID!, userId: ID!, status: String!): GroupEventParticipant!
    
    # Smart class scheduling
    optimizeClassSchedule(userIds: [ID!]!, term: String): OptimizedScheduleResult!
  }
  
  type User {
    id: ID!
    name: String
    email: String
    events: [Event!]!
    courses: [UserCourse!]!
    friends: [Friendship!]!
    assessments: [Assessment!]!
  }
  
  type Event {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    description: String
    courseId: ID
    startTime: String!
    endTime: String!
    location: String
    isRecurring: Boolean!
    recurrenceRule: String
    user: User!
    course: Course
  }
  
  type Course {
    id: ID!
    code: String!
    name: String!
    term: String
  }
  
  type CourseSearchResult {
    code: String!
    name: String!
    term: String!
  }
  
  type UserCourse {
    userId: ID!
    courseId: ID!
    section: String
    user: User!
    course: Course!
  }
  
  type Friendship {
    userId: ID!
    friendId: ID!
    status: String!
    user: User!
    friend: User!
  }
  
  type Assessment {
    id: ID!
    userId: ID!
    courseId: ID!
    title: String!
    description: String
    dueDate: String!
    weight: Int
    user: User!
    course: Course!
  }
  
  type GroupEvent {
    id: ID!
    title: String!
    description: String
    createdBy: ID!
    startTime: String!
    endTime: String!
    location: String
    participants: [GroupEventParticipant!]!
  }
  
  type GroupEventParticipant {
    groupEventId: ID!
    userId: ID!
    status: String!
    user: User!
  }
  
  type TimeSlot {
    start: String!
    end: String!
    duration: Int!
  }
  
  type SyncResult {
    success: Boolean!
    eventsCreated: Int!
    message: String
  }
  
  type OptimizedScheduleResult {
    success: Boolean!
    classMatches: [ClassMatch!]!
    stats: ScheduleStats!
    message: String
  }
  
  type ClassMatch {
    courseCode: String!
    classType: String!
    classId: String!
    day: String!
    startTime: String!
    endTime: String!
    location: String!
    sharedWith: [ID!]!
    matchScore: Int!
  }
  
  type ScheduleStats {
    totalClasses: Int!
    classesWithAllFriends: Int!
    classesWithSomeFriends: Int!
    classesAlone: Int!
    averageOverlap: Float!
  }
  
  input CreateEventInput {
    userId: ID!
    type: String!
    title: String!
    description: String
    courseId: ID
    startTime: String!
    endTime: String!
    location: String
    isRecurring: Boolean
    recurrenceRule: String
  }
  
  input UpdateEventInput {
    title: String
    description: String
    startTime: String
    endTime: String
    location: String
  }
  
  input CreateAssessmentInput {
    userId: ID!
    courseId: ID!
    title: String!
    description: String
    dueDate: String!
    weight: Int
  }
  
  input UpdateAssessmentInput {
    title: String
    description: String
    dueDate: String
    weight: Int
  }
  
  input CreateGroupEventInput {
    title: String!
    description: String
    createdBy: ID!
    startTime: String!
    endTime: String!
    location: String
    participantIds: [ID!]!
  }
`

const resolvers = {
  Query: {
    hello: () => 'SyncUp API - Your intelligent social calendar!',
    
    user: async (_: any, { id }: any) => {
      return prisma.user.findUnique({ where: { id } })
    },
    
    users: async () => {
      return prisma.user.findMany()
    },
    
    events: async (_: any, { userId, startDate, endDate }: any) => {
      const where: any = { userId }
      
      if (startDate && endDate) {
        where.startTime = { gte: new Date(startDate) }
        where.endTime = { lte: new Date(endDate) }
      }
      
      return prisma.event.findMany({
        where,
        include: { user: true, course: true },
        orderBy: { startTime: 'asc' }
      })
    },
    
    event: async (_: any, { id }: any) => {
      return prisma.event.findUnique({
        where: { id },
        include: { user: true, course: true }
      })
    },
    
    findGroupAvailability: async (_: any, args: any) => {
      const { userIds, startDate, endDate, minDuration = 30 } = args
      
      // Fetch all events for each user in the date range
      const schedules = await Promise.all(
        userIds.map(async (userId: string) => {
          const events = await prisma.event.findMany({
            where: {
              userId,
              startTime: { gte: new Date(startDate) },
              endTime: { lte: new Date(endDate) }
            }
          })
          
          return {
            userId,
            busySlots: events.map((e: any) => ({
              start: e.startTime,
              end: e.endTime
            }))
          }
        })
      )
      
      const searchRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
      
      const freeSlots = AvailabilityFinder.findCommonFreeTime(
        schedules,
        searchRange,
        minDuration
      )
      
      return freeSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        duration: Math.floor((slot.end.getTime() - slot.start.getTime()) / (1000 * 60))
      }))
    },
    
    courses: async () => {
      return prisma.course.findMany()
    },
    
    userCourses: async (_: any, { userId }: any) => {
      return prisma.userCourse.findMany({
        where: { userId },
        include: { course: true, user: true }
      })
    },
    
    searchCourses: async (_: any, { searchTerm, term = '25T1' }: any) => {
      return searchCourses(searchTerm, term)
    },
    
    friends: async (_: any, { userId }: any) => {
      return prisma.friendship.findMany({
        where: {
          userId,
          status: 'ACCEPTED'
        },
        include: { 
          user: true, 
          friend: true
        }
      })
    },
    
    friendRequests: async (_: any, { userId }: any) => {
      return prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: 'PENDING'
        },
        include: { user: true, friend: true }
      })
    },
    
    assessments: async (_: any, { userId }: any) => {
      return prisma.assessment.findMany({
        where: { userId },
        include: { user: true, course: true },
        orderBy: { dueDate: 'asc' }
      })
    },
    
    upcomingAssessments: async (_: any, { userId, days = 7 }: any) => {
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(now.getDate() + days)
      
      return prisma.assessment.findMany({
        where: {
          userId,
          dueDate: {
            gte: now,
            lte: futureDate
          }
        },
        include: { user: true, course: true },
        orderBy: { dueDate: 'asc' }
      })
    },
    
    groupEvents: async (_: any, { userId }: any) => {
      const participations = await prisma.groupEventParticipant.findMany({
        where: { userId },
        include: {
          groupEvent: {
            include: {
              participants: {
                include: { user: true }
              }
            }
          }
        }
      })
      
      return participations.map((p: any) => p.groupEvent)
    }
  },
  
  User: {
    courses: async (parent: any) => {
      return prisma.userCourse.findMany({
        where: { userId: parent.id },
        take: 3,
        include: { course: true }
      })
    }
  },
  
  Mutation: {
    createUser: async (_: any, { email, name }: any) => {
      return prisma.user.create({
        data: { email, name }
      })
    },
    
    createEvent: async (_: any, { input }: any) => {
      return prisma.event.create({
        data: {
          ...input,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          createdBy: input.userId
        },
        include: { user: true, course: true }
      })
    },
    
    updateEvent: async (_: any, { id, input }: any) => {
      const updateData: any = { ...input }
      if (input.startTime) updateData.startTime = new Date(input.startTime)
      if (input.endTime) updateData.endTime = new Date(input.endTime)
      
      return prisma.event.update({
        where: { id },
        data: updateData,
        include: { user: true, course: true }
      })
    },
    
    deleteEvent: async (_: any, { id }: any) => {
      await prisma.event.delete({ where: { id } })
      return true
    },
    
    enrollCourse: async (_: any, { userId, courseCode, term }: any) => {
      // Check current enrollment count (max 3 courses)
      const currentEnrollments = await prisma.userCourse.count({
        where: { userId }
      })
      
      // First, check if course exists or create it
      let course = await prisma.course.findUnique({
        where: { code: courseCode }
      })
      
      if (!course) {
        course = await prisma.course.create({
          data: {
            code: courseCode,
            name: courseCode, // Will be updated when syncing
            term
          }
        })
      }
      
      // Check if already enrolled
      const existing = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id
          }
        },
        include: { user: true, course: true }
      })
      
      if (existing) {
        // Already enrolled, just return the existing enrollment
        return existing
      }
      
      // Enforce 3-course limit
      if (currentEnrollments >= 3) {
        throw new Error('Maximum 3 courses allowed. Please unenroll from a course first.')
      }
      
      // Create new enrollment
      return prisma.userCourse.create({
        data: {
          userId,
          courseId: course.id
        },
        include: { user: true, course: true }
      })
    },
    
    syncTimetable: async (_: any, { userId, courseCode, term }: any) => {
      try {
        // Fetch timetable from DevSoc API
        const timetableEntries = await fetchCourseSchedules(courseCode, term)
        
        if (timetableEntries.length === 0) {
          return {
            success: false,
            eventsCreated: 0,
            message: 'No classes found for this course'
          }
        }
        
        // Find or create course
        let course = await prisma.course.findUnique({
          where: { code: courseCode }
        })
        
        if (!course) {
          course = await prisma.course.create({
            data: {
              code: courseCode,
              name: timetableEntries[0].courseName,
              term
            }
          })
        }
        
        // Sync to database
        const result = await syncTimetableToDatabase(userId, course.id, timetableEntries, prisma)
        
        return {
          success: true,
          eventsCreated: result.count,
          message: `Successfully synced ${result.count} classes`
        }
      } catch (error: any) {
        return {
          success: false,
          eventsCreated: 0,
          message: error.message
        }
      }
    },
    
    sendFriendRequest: async (_: any, { userId, friendId }: any) => {
      return prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: 'PENDING'
        },
        include: { user: true, friend: true }
      })
    },
    
    acceptFriendRequest: async (_: any, { userId, friendId }: any) => {
      // Update the friend request
      const updated = await prisma.friendship.update({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: userId
          }
        },
        data: { status: 'ACCEPTED' },
        include: { user: true, friend: true }
      })
      
      // Create reverse friendship
      await prisma.friendship.create({
        data: {
          userId,
          friendId,
          status: 'ACCEPTED'
        }
      })
      
      return updated
    },
    
    rejectFriendRequest: async (_: any, { userId, friendId }: any) => {
      await prisma.friendship.delete({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: userId
          }
        }
      })
      return true
    },
    
    createAssessment: async (_: any, { input }: any) => {
      const assessment = await prisma.assessment.create({
        data: {
          ...input,
          dueDate: new Date(input.dueDate)
        },
        include: { user: true, course: true }
      })
      
      // Also create a calendar event for the assessment
      await prisma.event.create({
        data: {
          userId: input.userId,
          type: 'ASSESSMENT',
          title: `Due: ${input.title}`,
          description: input.description,
          courseId: input.courseId,
          startTime: new Date(input.dueDate),
          endTime: new Date(input.dueDate),
          createdBy: input.userId
        }
      })
      
      return assessment
    },
    
    updateAssessment: async (_: any, { id, input }: any) => {
      const updateData: any = { ...input }
      if (input.dueDate) updateData.dueDate = new Date(input.dueDate)
      
      return prisma.assessment.update({
        where: { id },
        data: updateData,
        include: { user: true, course: true }
      })
    },
    
    deleteAssessment: async (_: any, { id }: any) => {
      await prisma.assessment.delete({ where: { id } })
      return true
    },
    
    createGroupEvent: async (_: any, { input }: any) => {
      const { participantIds, ...eventData } = input
      
      const groupEvent = await prisma.groupEvent.create({
        data: {
          ...eventData,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          participants: {
            create: participantIds.map((userId: string) => ({
              userId,
              status: userId === input.createdBy ? 'ACCEPTED' : 'INVITED'
            }))
          }
        },
        include: {
          participants: {
            include: { user: true }
          }
        }
      })
      
      return groupEvent
    },
    
    inviteToGroupEvent: async (_: any, { groupEventId, userId }: any) => {
      return prisma.groupEventParticipant.create({
        data: {
          groupEventId,
          userId,
          status: 'INVITED'
        },
        include: { user: true, groupEvent: true }
      })
    },
    
    respondToGroupEvent: async (_: any, { groupEventId, userId, status }: any) => {
      return prisma.groupEventParticipant.update({
        where: {
          groupEventId_userId: { groupEventId, userId }
        },
        data: { status },
        include: { user: true, groupEvent: true }
      })
    },
    
    optimizeClassSchedule: async (_: any, { userIds, term = 'T3' }: any) => {
      try {
        // Fetch each user's selected courses
        const userSelections = await Promise.all(
          userIds.map(async (userId: string) => {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true }
            })
            
            const userCourses = await prisma.userCourse.findMany({
              where: { userId },
              include: { course: true },
              take: 3 // Limit to 3 courses
            })
            
            return {
              userId,
              userName: user?.name || 'Unknown',
              courses: userCourses.map((uc: any) => uc.course.code)
            }
          })
        )
        
        // Find optimal class schedule
        const classMatches = await findOptimalClassSchedule(userSelections, term)
        
        // Calculate statistics
        const stats = calculateOverlapStats(classMatches, userIds.length)
        
        return {
          success: true,
          classMatches,
          stats,
          message: classMatches.length > 0 
            ? `Found ${classMatches.length} optimal class times with average ${stats.averageOverlap.toFixed(1)} friends per class`
            : `No classes found. Make sure users have enrolled in courses for term ${term}.`
        }
      } catch (error) {
        console.error('Failed to optimize class schedule:', error)
        return {
          success: false,
          classMatches: [],
          stats: {
            totalClasses: 0,
            classesWithAllFriends: 0,
            classesWithSomeFriends: 0,
            classesAlone: 0,
            averageOverlap: 0
          },
          message: `Failed to optimize schedule: ${error}`
        }
      }
    }
  }
}

async function start() {
  const app = express()
  app.use(cors())

  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()
  server.applyMiddleware({ app: app as any, path: '/graphql' })

  const port = process.env.PORT ? Number(process.env.PORT) : 4000
  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
