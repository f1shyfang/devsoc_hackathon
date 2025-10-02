"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Calendar, Users, Plus, Clock, Grid3x3, X, Search, BookOpen } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function graphqlRequest(query: string, variables?: any) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  })
  
  const result = await response.json()
  if (result.errors) {
    throw new Error(result.errors[0].message)
  }
  return result.data
}

export default function CalendarPage() {
  const queryClient = useQueryClient()
  // Using John's user ID from test data - In production, get from auth
  const userId = "cmg69p0vb0000kfq7c7at5yzo"
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [showAvailability, setShowAvailability] = useState(false)
  const [enrolledCoursesLoaded, setEnrolledCoursesLoaded] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courseSearchTerm, setCourseSearchTerm] = useState("")
  const [showOptimizationResults, setShowOptimizationResults] = useState(false)
  const [optimizationData, setOptimizationData] = useState<any>(null)
  // Set date range to October 2025 to show test events
  const [startDate] = useState("2025-10-01T00:00:00Z")
  const [endDate] = useState("2025-10-31T23:59:59Z")
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "CUSTOM",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  })

  // Fetch user's enrolled courses on page load
  const { data: enrolledCoursesData } = useQuery({
    queryKey: ['userCourses', userId],
    queryFn: () => graphqlRequest(`
      query GetUserCourses($userId: ID!) {
        userCourses(userId: $userId) {
          course {
            code
          }
        }
      }
    `, { userId }),
  })

  // Populate selectedCourses from enrolled courses on first load
  useEffect(() => {
    if (enrolledCoursesData && !enrolledCoursesLoaded) {
      const courses = (enrolledCoursesData as any)?.userCourses?.map((uc: any) => uc.course.code) || []
      setSelectedCourses(courses.slice(0, 3)) // Max 3 courses
      setEnrolledCoursesLoaded(true)
    }
  }, [enrolledCoursesData, enrolledCoursesLoaded])

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', userId, startDate, endDate],
    queryFn: () => graphqlRequest(`
      query GetUserEvents($userId: ID!, $startDate: String, $endDate: String) {
        events(userId: $userId, startDate: $startDate, endDate: $endDate) {
          id
          title
          type
          startTime
          endTime
          location
          description
          course {
            code
            name
          }
        }
      }
    `, { userId, startDate, endDate }),
  })

  const { data: friendsData } = useQuery({
    queryKey: ['friends', userId],
    queryFn: () => graphqlRequest(`
      query GetFriends($userId: ID!) {
        friends(userId: $userId) {
          friendId
          friend {
            id
            name
            email
            courses {
              course {
                code
              }
            }
          }
        }
      }
    `, { userId }),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['searchCourses', courseSearchTerm],
    queryFn: () => graphqlRequest(`
      query SearchCourses($searchTerm: String!, $term: String) {
        searchCourses(searchTerm: $searchTerm, term: $term) {
          code
          name
          term
        }
      }
    `, { searchTerm: courseSearchTerm, term: '25T1' }),
    enabled: courseSearchTerm.length >= 2,
  })

  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ['availability', userId, selectedFriends, startDate, endDate],
    queryFn: () => graphqlRequest(`
      query FindGroupAvailability(
        $userIds: [ID!]!
        $startDate: String!
        $endDate: String!
        $minDuration: Int
      ) {
        findGroupAvailability(
          userIds: $userIds
          startDate: $startDate
          endDate: $endDate
          minDuration: $minDuration
        ) {
          start
          end
          duration
        }
      }
    `, {
      userIds: [userId, ...selectedFriends],
      startDate,
      endDate,
      minDuration: 60,
    }),
    enabled: showAvailability && selectedFriends.length > 0,
  })

  const optimizeScheduleMutation = useMutation({
    mutationFn: async () => {
      const userIds = [userId, ...selectedFriends]
      console.log("Optimizing for users:", userIds)
      console.log("Selected courses:", selectedCourses)
      
      // Validate that user has selected courses
      if (selectedCourses.length === 0) {
        throw new Error("Please select at least one course first")
      }
      
      const result = await graphqlRequest(`
        mutation OptimizeSchedule($userIds: [ID!]!, $term: String) {
          optimizeClassSchedule(userIds: $userIds, term: $term) {
            success
            message
            classMatches {
              courseCode
              classType
              day
              startTime
              endTime
              location
              sharedWith
              matchScore
            }
            stats {
              totalClasses
              classesWithAllFriends
              classesWithSomeFriends
              classesAlone
              averageOverlap
            }
          }
        }
      `, { userIds, term: 'T3' })
      
      console.log("Optimization result:", result)
      return result
    },
    onSuccess: (data: any) => {
      console.log("Success! Data:", data)
      if (data?.optimizeClassSchedule) {
        const result = data.optimizeClassSchedule
        
        console.log("Selected courses:", selectedCourses)
        console.log("Returned classes:", result.classMatches.map((m: any) => m.courseCode))
        
        // Filter to only show classes for courses selected in the UI
        const filteredMatches = result.classMatches.filter((match: any) => 
          selectedCourses.includes(match.courseCode)
        )
        
        console.log(`Filtered from ${result.classMatches.length} to ${filteredMatches.length} classes`)
        console.log("Filtered matches:", filteredMatches)
        
        // Update result with filtered matches
        const filteredResult = {
          ...result,
          classMatches: filteredMatches,
          stats: {
            ...result.stats,
            totalClasses: filteredMatches.length
          }
        }
        
        setOptimizationData(filteredResult)
        setShowOptimizationResults(true)
        setError(null)
        
        // If no classes found, also show error message
        if (filteredMatches.length === 0) {
          setError(`No classes found for your selected courses: ${selectedCourses.join(', ')}`)
        }
      } else {
        setError("No optimization data returned")
      }
    },
    onError: (err: Error) => {
      console.error("Optimization error:", err)
      setError(err.message || "Failed to optimize schedule")
    },
  })

  const createEventMutation = useMutation({
    mutationFn: async (input: typeof formData) => {
      const startDateTime = new Date(`${input.startDate}T${input.startTime}:00`)
      const endDateTime = new Date(`${input.endDate}T${input.endTime}:00`)
      
      const variables = {
        input: {
          userId,
          type: input.type,
          title: input.title,
          description: input.description || null,
          location: input.location || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }
      }
      
      console.log("Sending mutation with variables:", variables)
      
      try {
        const result = await graphqlRequest(`
          mutation CreateEvent($input: CreateEventInput!) {
            createEvent(input: $input) {
              id
              title
              type
              startTime
              endTime
              location
              description
            }
          }
        `, variables)
        
        console.log("Event created successfully:", result)
        return result
      } catch (error) {
        console.error("GraphQL Error:", error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowCreateModal(false)
      setError(null)
      setFormData({
        title: "",
        type: "CUSTOM",
        description: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      })
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create event")
    },
  })

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }
  
  const enrollCourseMutation = useMutation({
    mutationFn: async ({ courseCode, term }: { courseCode: string; term: string }) => {
      return graphqlRequest(`
        mutation EnrollCourse($userId: ID!, $courseCode: String!, $term: String!) {
          enrollCourse(userId: $userId, courseCode: $courseCode, term: $term) {
            courseId
            course {
              code
              name
            }
          }
        }
      `, { userId, courseCode, term })
    },
  })

  const toggleCourse = async (courseCode: string) => {
    const isCurrentlySelected = selectedCourses.includes(courseCode)
    
    if (isCurrentlySelected) {
      // Remove from selected courses
      setSelectedCourses((prev) => prev.filter((code) => code !== courseCode))
      console.log(`Removed ${courseCode} from selection`)
    } else if (selectedCourses.length < 3) {
      // Add to selected courses and enroll
      try {
        // Optimistically add to UI
        setSelectedCourses((prev) => [...prev, courseCode])
        
        // Enroll the user in this course
        await enrollCourseMutation.mutateAsync({ courseCode, term: 'T3' })
        console.log(`Enrolled in ${courseCode}`)
        
        // Invalidate the enrolled courses query to refresh
        queryClient.invalidateQueries({ queryKey: ['userCourses', userId] })
      } catch (error: any) {
        console.error(`Failed to enroll in ${courseCode}:`, error)
        // Remove from selection if enrollment failed
        setSelectedCourses((prev) => prev.filter((code) => code !== courseCode))
        setError(error?.message || `Failed to enroll in ${courseCode}`)
      }
    } else {
      // At limit
      setError('Maximum 3 courses allowed. Remove a course first.')
    }
  }
  
  const addOptimizedClassesToCalendar = async () => {
    if (!optimizationData?.classMatches) return
    
    try {
      // Create events for each optimized class
      for (const match of optimizationData.classMatches) {
        // Parse day and time to create proper date
        // DevSoc API uses short day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        const dayMap: Record<string, number> = {
          'Mon': 1, 'Tue': 2, 'Wed': 3, 
          'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
        }
        
        // Find the next occurrence of this day in October 2025
        const targetDay = dayMap[match.day]
        if (targetDay === undefined) {
          console.error(`Unknown day: ${match.day}`)
          continue
        }
        
        const baseDate = new Date('2025-10-01T00:00:00Z')
        const currentDay = baseDate.getDay()
        const daysUntil = (targetDay - currentDay + 7) % 7
        const eventDate = new Date(baseDate)
        eventDate.setDate(baseDate.getDate() + daysUntil)
        
        // Set the time - parse "HH:MM" format
        const [startHours, startMinutes] = match.startTime.split(':').map(Number)
        const [endHours, endMinutes] = match.endTime.split(':').map(Number)
        
        if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
          console.error(`Invalid time format: ${match.startTime} - ${match.endTime}`)
          continue
        }
        
        const startDateTime = new Date(eventDate)
        startDateTime.setHours(startHours, startMinutes, 0, 0)
        
        const endDateTime = new Date(eventDate)
        endDateTime.setHours(endHours, endMinutes, 0, 0)
        
        // Create the event
        await graphqlRequest(`
          mutation CreateEvent($input: CreateEventInput!) {
            createEvent(input: $input) {
              id
              title
            }
          }
        `, {
          input: {
            userId,
            type: 'CLASS',
            title: `${match.courseCode} ${match.classType}`,
            description: `With ${match.matchScore} ${match.matchScore === 1 ? 'person' : 'people'}`,
            location: match.location,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            isRecurring: true,
            recurrenceRule: `FREQ=WEEKLY;BYDAY=${match.day.substring(0, 2).toUpperCase()}`
          }
        })
      }
      
      // Refresh events and close modal
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setShowOptimizationResults(false)
      setOptimizationData(null)
    } catch (error) {
      console.error('Failed to add classes:', error)
      setError('Failed to add classes to calendar')
    }
  }
  
  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    setError(null)
    
    // Validate dates
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      setError("Please fill in all required fields")
      return
    }
    
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`)
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError("Invalid date or time format")
        return
      }
      
      if (endDateTime <= startDateTime) {
        setError("End time must be after start time")
        return
      }
      
      console.log("Creating event with dates:", {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      })
      
      createEventMutation.mutate(formData)
    } catch (err) {
      console.error("Date parsing error:", err)
      setError("Invalid date format")
    }
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLASS: "bg-blue-500",
      CUSTOM: "bg-purple-500",
      ASSESSMENT: "bg-red-500",
      STUDY: "bg-amber-500",
      SOCIAL: "bg-green-500",
    }
    return colors[type] || "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              SyncUp Calendar
            </h1>
            <p className="text-black">
              Find common free time with your friends and schedule group activities
            </p>
          </div>
          <Link
            href="/calendar-grid"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid View
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Friends Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-black">Select Friends</h2>
              </div>

              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(friendsData as any)?.friends?.length > 0 ? (
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  (friendsData as any).friends.map((friendship: any) => (
                    <label
                      key={friendship.friendId}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friendship.friendId)}
                        onChange={() => toggleFriend(friendship.friendId)}
                        className="w-4 h-4 text-blue-500 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {friendship.friend.name}
                        </p>
                        <p className="text-xs text-black">
                          {friendship.friend.email}
                        </p>
                        {friendship.friend.courses?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {friendship.friend.courses.slice(0, 3).map((uc: any) => (
                              <span
                                key={uc.course.code}
                                className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                              >
                                {uc.course.code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-black">
                    No friends added yet. Add friends to find common free time!
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowAvailability(!showAvailability)}
                disabled={selectedFriends.length === 0}
                className={`mt-4 w-full py-2 px-4 rounded font-medium transition-colors ${
                  showAvailability && selectedFriends.length > 0
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : selectedFriends.length > 0
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {showAvailability ? "Hide Availability" : "Find Common Time"}
              </button>
            </div>

            {/* Courses Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-black">Courses</h2>
                </div>
                <span className="text-xs text-black">
                  {selectedCourses.length}/3
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses (e.g., COMP1531)"
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Course Results */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {courseSearchTerm.length < 2 ? (
                  <p className="text-sm text-black text-center py-4">
                    Type at least 2 characters to search
                  </p>
                ) : coursesLoading ? (
                  <p className="text-sm text-black text-center py-4">
                    Searching...
                  </p>
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                ) : (coursesData as any)?.searchCourses?.length > 0 ? (
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  (coursesData as any).searchCourses.map((course: any) => (
                    <label
                      key={course.code}
                      className={`flex items-start gap-2 p-2 rounded ${
                        selectedCourses.length >= 3 && !selectedCourses.includes(course.code)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.code)}
                        onChange={() => toggleCourse(course.code)}
                        disabled={selectedCourses.length >= 3 && !selectedCourses.includes(course.code)}
                        className="w-4 h-4 text-blue-500 rounded mt-0.5 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {course.code}
                        </p>
                        <p className="text-xs text-black line-clamp-2">
                          {course.name}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          {course.term}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-black text-center py-4">
                    No courses found
                  </p>
                )}
              </div>

              {selectedCourses.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-black mb-2">
                    Enrolled: {selectedCourses.length}/3
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCourses.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                      >
                        ✓ {code}
                        <button
                          onClick={() => toggleCourse(code)}
                          className="hover:text-green-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {enrollCourseMutation.isPending && (
                    <div className="mb-2 text-xs text-blue-600">
                      Enrolling in course...
                    </div>
                  )}
                  
                  <button
                    onClick={() => optimizeScheduleMutation.mutate()}
                    disabled={selectedFriends.length === 0 || optimizeScheduleMutation.isPending}
                    className={`w-full py-2 px-4 rounded font-medium text-sm transition-colors ${
                      selectedFriends.length > 0
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {optimizeScheduleMutation.isPending ? "Optimizing..." : "🎯 Optimize Class Schedule"}
                  </button>
                  
                  {optimizeScheduleMutation.isError && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: Check console for details
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Event Legend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-black mb-3">Event Types</h3>
              <div className="space-y-2">
                {[
                  { type: "CLASS", label: "Classes" },
                  { type: "STUDY", label: "Study Time" },
                  { type: "ASSESSMENT", label: "Assessments" },
                  { type: "SOCIAL", label: "Social" },
                  { type: "CUSTOM", label: "Custom" },
                ].map(({ type, label }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${getEventTypeColor(type)}`}
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Available Time Slots */}
            {showAvailability && availabilityData && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold">
                    Common Available Time Slots
                  </h2>
                </div>

                {availabilityLoading ? (
                  <p className="text-black">Finding available times...</p>
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                ) : (availabilityData as any)?.findGroupAvailability?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(availabilityData as any).findGroupAvailability.map(
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      (slot: any, index: number) => (
                        <div
                          key={index}
                          className="border border-green-200 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {format(new Date(slot.start), "EEE, MMM d")}
                              </p>
                              <p className="text-sm text-black">
                                {format(new Date(slot.start), "h:mm a")} -{" "}
                                {format(new Date(slot.end), "h:mm a")}
                              </p>
                            </div>
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              {slot.duration} min
                            </span>
                          </div>
                          <button className="w-full mt-2 bg-green-500 text-white text-sm py-1 rounded hover:bg-green-600">
                            Create Event
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-black">
                    No common free time found. Try selecting different friends or
                    adjusting the time range.
                  </p>
                )}
              </div>
            )}

            {/* Events List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Your Schedule</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete all events?')) {
                        try {
                          const events = (eventsData as any)?.events || []
                          for (const event of events) {
                            await graphqlRequest(`
                              mutation DeleteEvent($id: ID!) {
                                deleteEvent(id: $id)
                              }
                            `, { id: event.id })
                          }
                          queryClient.invalidateQueries({ queryKey: ['events'] })
                        } catch (error) {
                          console.error('Failed to clear calendar:', error)
                          setError('Failed to clear calendar')
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                    Clear Calendar
                  </button>
                  <button 
                    onClick={() => {
                      console.log("Add Event button clicked")
                      setShowCreateModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                </div>
              </div>

              {eventsLoading ? (
                <p className="text-black">Loading events...</p>
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              ) : (eventsData as any)?.events?.length > 0 ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(eventsData as any).events.map((event: any) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-1 h-full rounded ${getEventTypeColor(
                            event.type
                          )}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {event.title}
                              </h3>
                              {event.course && (
                                <p className="text-sm text-black">
                                  {event.course.code} - {event.course.name}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded text-white ${getEventTypeColor(
                                event.type
                              )}`}
                            >
                              {event.type}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-black">
                            <p>
                              📅 {format(new Date(parseInt(event.startTime)), "EEE, MMM d")}
                            </p>
                            <p>
                              🕐 {format(new Date(parseInt(event.startTime)), "h:mm a")} -{" "}
                              {format(new Date(parseInt(event.endTime)), "h:mm a")}
                            </p>
                            {event.location && <p>📍 {event.location}</p>}
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-black">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-black">
                    No events scheduled. Add your first event or sync your
                    timetable!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitEvent} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Study for COMP1531"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CUSTOM">Custom</option>
                    <option value="CLASS">Class</option>
                    <option value="STUDY">Study</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="SOCIAL">Social</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Library Level 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any additional details..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createEventMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Optimization Results Modal */}
        {showOptimizationResults && optimizationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🎯 Optimized Class Schedule</h2>
                  <p className="text-sm text-black mt-1">{optimizationData.message}</p>
                </div>
                <button
                  onClick={() => setShowOptimizationResults(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-black">Total Classes</p>
                    <p className="text-2xl font-bold text-blue-600">{optimizationData.stats.totalClasses}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-black">All Friends Together</p>
                    <p className="text-2xl font-bold text-green-600">{optimizationData.stats.classesWithAllFriends}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-black">Some Friends</p>
                    <p className="text-2xl font-bold text-yellow-600">{optimizationData.stats.classesWithSomeFriends}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-black">Avg Overlap</p>
                    <p className="text-2xl font-bold text-purple-600">{optimizationData.stats.averageOverlap.toFixed(1)}</p>
                  </div>
                </div>

                {/* Class List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-3">Recommended Classes</h3>
                  {optimizationData.classMatches.map((match: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {match.courseCode} - {match.classType}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              match.matchScore === selectedFriends.length + 1
                                ? 'bg-green-100 text-green-700'
                                : match.matchScore > 1
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {match.matchScore - 1 === 0 ? 'Just you' : `${match.matchScore - 1} ${match.matchScore - 1 === 1 ? 'friend' : 'friends'}`}
                              {match.matchScore > 1 && match.sharedWith.length > 1 && (
                                <span> - other courses</span>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-black space-y-1">
                            <p>📅 {match.day} at {match.startTime} - {match.endTime}</p>
                            <p>📍 {match.location}</p>
                            <p className="text-xs text-black">
                              {match.matchScore === selectedFriends.length + 1 ? (
                                <span className="text-green-600 font-medium">✓ All friends in same class!</span>
                              ) : match.matchScore > 1 ? (
                                <span className="text-yellow-600">Friends have class at same time (different courses)</span>
                              ) : (
                                <span>No friends at this time</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowOptimizationResults(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={addOptimizedClassesToCalendar}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    ✅ Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
