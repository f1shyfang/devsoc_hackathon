"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Users, Plus, Clock } from "lucide-react"
import { format } from "date-fns"

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
  const [userId] = useState("demo-user-id") // In production, get from auth
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [showAvailability, setShowAvailability] = useState(false)
  const [startDate] = useState(new Date().toISOString())
  const [endDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  )

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
          }
        }
      }
    `, { userId }),
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

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SyncUp Calendar
          </h1>
          <p className="text-gray-600">
            Find common free time with your friends and schedule group activities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Friends Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Select Friends</h2>
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
                        <p className="text-xs text-gray-500">
                          {friendship.friend.email}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
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

            {/* Event Legend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3">Event Types</h3>
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
                  <p className="text-gray-500">Finding available times...</p>
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
                              <p className="text-sm text-gray-600">
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
                  <p className="text-gray-500">
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
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>

              {eventsLoading ? (
                <p className="text-gray-500">Loading events...</p>
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
                                <p className="text-sm text-gray-600">
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
                          <div className="mt-2 text-sm text-gray-600">
                            <p>
                              📅 {format(new Date(event.startTime), "EEE, MMM d")}
                            </p>
                            <p>
                              🕐 {format(new Date(event.startTime), "h:mm a")} -{" "}
                              {format(new Date(event.endTime), "h:mm a")}
                            </p>
                            {event.location && <p>📍 {event.location}</p>}
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-700">
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
                  <p className="text-gray-500">
                    No events scheduled. Add your first event or sync your
                    timetable!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
