"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, differenceInMinutes, parseISO } from "date-fns"
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

interface Event {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string
  location?: string
  description?: string
}

export default function CalendarGridPage() {
  const queryClient = useQueryClient()
  const [userId] = useState("cmg69p0vb0000kfq7c7at5yzo")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)

  // Generate week dates
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  
  // Time slots from 6 AM to 11 PM
  const timeSlots = Array.from({ length: 34 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6
    const minute = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const startDate = currentWeekStart.toISOString()
  const endDate = addDays(currentWeekStart, 7).toISOString()

  const { data: eventsData } = useQuery({
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
        }
      }
    `, { userId, startDate, endDate }),
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, startTime, endTime }: { eventId: string; startTime: string; endTime: string }) =>
      graphqlRequest(`
        mutation UpdateEvent($eventId: ID!, $startTime: String!, $endTime: String!) {
          updateEvent(id: $eventId, input: {
            startTime: $startTime
            endTime: $endTime
          }) {
            id
            startTime
            endTime
          }
        }
      `, { eventId, startTime, endTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLASS: "bg-blue-500 border-blue-600",
      CUSTOM: "bg-purple-500 border-purple-600",
      ASSESSMENT: "bg-red-500 border-red-600",
      STUDY: "bg-amber-500 border-amber-600",
      SOCIAL: "bg-green-500 border-green-600",
    }
    return colors[type] || "bg-gray-500 border-gray-600"
  }

  const handleDragStart = (event: Event) => {
    setDraggedEvent(event)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, date: Date, timeSlot: string) => {
    e.preventDefault()
    if (!draggedEvent) return

    const [hours, minutes] = timeSlot.split(':').map(Number)
    const newStartDate = new Date(date)
    newStartDate.setHours(hours, minutes, 0, 0)

    // Calculate event duration
    const originalStart = new Date(parseInt(draggedEvent.startTime))
    const originalEnd = new Date(parseInt(draggedEvent.endTime))
    const durationMs = originalEnd.getTime() - originalStart.getTime()

    const newEndDate = new Date(newStartDate.getTime() + durationMs)

    updateEventMutation.mutate({
      eventId: draggedEvent.id,
      startTime: newStartDate.getTime().toString(),
      endTime: newEndDate.getTime().toString(),
    })

    setDraggedEvent(null)
  }

  const getEventsForSlot = (date: Date, timeSlot: string) => {
    if (!eventsData?.events) return []
    
    const [hours, minutes] = timeSlot.split(':').map(Number)
    const slotStart = new Date(date)
    slotStart.setHours(hours, minutes, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

    return eventsData.events.filter((event: Event) => {
      const eventStart = new Date(parseInt(event.startTime))
      const eventEnd = new Date(parseInt(event.endTime))
      
      // Check if event overlaps with this slot
      return eventStart < slotEnd && eventEnd > slotStart &&
        format(eventStart, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
  }

  const getEventPosition = (event: Event, date: Date) => {
    const eventStart = new Date(parseInt(event.startTime))
    const eventEnd = new Date(parseInt(event.endTime))
    
    // Calculate position within the day (starting from 6 AM)
    const dayStart = new Date(date)
    dayStart.setHours(6, 0, 0, 0)
    
    const minutesFromStart = differenceInMinutes(eventStart, dayStart)
    const durationMinutes = differenceInMinutes(eventEnd, eventStart)
    
    // Each slot is 30 minutes, each slot is 48px tall
    const top = (minutesFromStart / 30) * 48
    const height = Math.max((durationMinutes / 30) * 48, 48)
    
    return { top, height }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-500" />
              Weekly Calendar View
            </h1>
            <p className="text-gray-600 mt-1">Drag and drop events to reschedule</p>
          </div>
          
          <Link
            href="/calendar"
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
          >
            <List className="w-4 h-4" />
            List View
          </Link>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-lg font-semibold">
            {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
          </div>
          
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 font-semibold text-gray-600 border-r">Time</div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-4 text-center border-r last:border-r-0 ${
                  format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                <div className="font-semibold text-gray-900">{format(day, "EEE")}</div>
                <div className={`text-sm ${
                  format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1'
                    : 'text-gray-600 mt-1'
                }`}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          <div className="relative overflow-y-auto" style={{ maxHeight: '800px' }}>
            {timeSlots.map((timeSlot, slotIndex) => (
              <div key={slotIndex} className="grid grid-cols-8 border-b h-12">
                <div className="p-2 text-xs text-gray-500 border-r sticky left-0 bg-white">
                  {timeSlot}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const events = getEventsForSlot(day, timeSlot)
                  const isFirstSlotOfEvent = events.some((event: Event) => {
                    const eventStart = new Date(parseInt(event.startTime))
                    const [hours, minutes] = timeSlot.split(':').map(Number)
                    return eventStart.getHours() === hours && eventStart.getMinutes() === minutes
                  })

                  return (
                    <div
                      key={dayIndex}
                      className="border-r last:border-r-0 relative hover:bg-gray-50"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day, timeSlot)}
                    >
                      {isFirstSlotOfEvent && events.map((event: Event) => {
                        const { top, height } = getEventPosition(event, day)
                        // Only render if this is roughly the right slot
                        if (Math.abs(top - slotIndex * 48) > 24) return null

                        return (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            className={`absolute left-1 right-1 rounded px-2 py-1 cursor-move border-l-4 ${getEventTypeColor(
                              event.type
                            )} text-white text-xs overflow-hidden shadow-md hover:shadow-lg transition-shadow z-10`}
                            style={{
                              top: `${top - slotIndex * 48}px`,
                              height: `${height}px`,
                            }}
                          >
                            <div className="font-semibold truncate">{event.title}</div>
                            <div className="text-xs opacity-90 truncate">
                              {format(new Date(parseInt(event.startTime)), "h:mm a")}
                            </div>
                            {event.location && (
                              <div className="text-xs opacity-75 truncate">📍 {event.location}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 text-sm">Event Types</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { type: "CLASS", label: "Classes" },
              { type: "STUDY", label: "Study Time" },
              { type: "ASSESSMENT", label: "Assessments" },
              { type: "SOCIAL", label: "Social" },
              { type: "CUSTOM", label: "Custom" },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${getEventTypeColor(type).split(' ')[0]}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
