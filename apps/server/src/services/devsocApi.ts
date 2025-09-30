import { GraphQLClient, gql } from 'graphql-request'

const DEVSOC_API_URL = process.env.DEVSOC_API_URL || 'https://graphql.csesoc.app/v1/graphql'

const client = new GraphQLClient(DEVSOC_API_URL)

interface CourseClass {
  courseCode: string
  courseName: string
  classType: string
  day: string
  startTime: string
  endTime: string
  location: string
  weeks: number[]
}

interface TimetableEntry {
  id: string
  courseCode: string
  courseName: string
  classType: string
  day: string
  startTime: string
  endTime: string
  location: string
}

/**
 * Fetch course and class schedules from DevSoc API
 */
export async function fetchCourseSchedules(courseCode: string, term: string): Promise<TimetableEntry[]> {
  const query = gql`
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
  `
  
  try {
    const data: any = await client.request(query, { courseCode, term })
    
    return data.classes.map((cls: any) => ({
      id: cls.id,
      courseCode: cls.course.code,
      courseName: cls.course.name,
      classType: cls.type,
      day: cls.day,
      startTime: cls.start_time,
      endTime: cls.end_time,
      location: cls.location || 'TBA'
    }))
  } catch (error) {
    console.error('Failed to fetch course schedules:', error)
    throw new Error(`Could not fetch schedules for ${courseCode} from DevSoc API`)
  }
}

/**
 * Fetch room availability from DevSoc API
 */
export async function fetchRoomAvailability(buildingId?: string, minCapacity?: number) {
  const query = gql`
    query GetRoomAvailability($buildingId: String, $minCapacity: Int) {
      rooms(where: {
        ${buildingId ? `building_id: { _eq: $buildingId }` : ''}
        ${minCapacity ? `capacity: { _gte: $minCapacity }` : ''}
      }) {
        id
        name
        capacity
        building {
          id
          name
        }
        bookings {
          start_time
          end_time
          date
        }
      }
    }
  `
  
  try {
    const data: any = await client.request(query, { buildingId, minCapacity })
    return data.rooms
  } catch (error) {
    console.error('Failed to fetch room availability:', error)
    throw new Error('Could not fetch room availability from DevSoc API')
  }
}

/**
 * Helper function to parse time string to Date object
 */
function parseTimeToDateTime(day: string, time: string, weekNumber: number = 1): Date {
  const dayMap: Record<string, number> = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0
  }
  
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  const dayIndex = dayMap[day]
  
  // Calculate the date for the specific day of the week
  const currentDay = date.getDay()
  const daysUntilTarget = (dayIndex - currentDay + 7) % 7
  date.setDate(date.getDate() + daysUntilTarget + (weekNumber - 1) * 7)
  date.setHours(hours, minutes, 0, 0)
  
  return date
}

/**
 * Get day abbreviation for recurrence rules
 */
function getDayAbbreviation(day: string): string {
  const abbrevMap: Record<string, string> = {
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA',
    'Sunday': 'SU'
  }
  return abbrevMap[day] || 'MO'
}

/**
 * Sync timetable entries to the database
 */
export async function syncTimetableToDatabase(
  userId: string, 
  courseId: string,
  timetableEntries: TimetableEntry[],
  prisma: any
) {
  const events = timetableEntries.map(entry => ({
    userId,
    type: 'CLASS' as const,
    title: `${entry.courseCode} ${entry.classType}`,
    description: `${entry.courseName} at ${entry.location}`,
    courseId,
    startTime: parseTimeToDateTime(entry.day, entry.startTime),
    endTime: parseTimeToDateTime(entry.day, entry.endTime),
    location: entry.location,
    isRecurring: true,
    recurrenceRule: `FREQ=WEEKLY;BYDAY=${getDayAbbreviation(entry.day)}`,
    createdBy: userId
  }))
  
  // Batch insert events
  const created = await prisma.event.createMany({
    data: events,
    skipDuplicates: true
  })
  
  return created
}

export { parseTimeToDateTime, getDayAbbreviation }
