interface TimeSlot {
  start: Date
  end: Date
}

interface UserSchedule {
  userId: string
  busySlots: TimeSlot[]
}

export class AvailabilityFinder {
  /**
   * Find common free time slots among multiple users
   * @param schedules Array of user schedules with busy time slots
   * @param searchRange The time range to search within
   * @param minDuration Minimum duration for a free slot (in minutes)
   */
  static findCommonFreeTime(
    schedules: UserSchedule[],
    searchRange: TimeSlot,
    minDuration: number = 30
  ): TimeSlot[] {
    // Step 1: Merge all busy slots from all users
    const allBusySlots = schedules.flatMap(s => s.busySlots)
    
    // Step 2: Sort by start time
    allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime())
    
    // Step 3: Merge overlapping intervals
    const mergedBusy = this.mergeIntervals(allBusySlots)
    
    // Step 4: Find gaps (free slots) in the merged busy intervals
    const freeSlots: TimeSlot[] = []
    let currentTime = searchRange.start
    
    for (const busySlot of mergedBusy) {
      if (busySlot.start > currentTime) {
        const gap = {
          start: currentTime,
          end: busySlot.start
        }
        
        // Only include if gap is longer than minimum duration
        if (this.getDurationMinutes(gap) >= minDuration) {
          freeSlots.push(gap)
        }
      }
      currentTime = busySlot.end > currentTime ? busySlot.end : currentTime
    }
    
    // Check for free time after last busy slot
    if (currentTime < searchRange.end) {
      const gap = {
        start: currentTime,
        end: searchRange.end
      }
      if (this.getDurationMinutes(gap) >= minDuration) {
        freeSlots.push(gap)
      }
    }
    
    return freeSlots
  }
  
  /**
   * Merge overlapping time intervals
   */
  private static mergeIntervals(intervals: TimeSlot[]): TimeSlot[] {
    if (intervals.length === 0) return []
    
    const merged: TimeSlot[] = [intervals[0]]
    
    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1]
      const current = intervals[i]
      
      if (current.start <= last.end) {
        // Overlapping intervals, merge them
        last.end = current.end > last.end ? current.end : last.end
      } else {
        // Non-overlapping, add as new interval
        merged.push(current)
      }
    }
    
    return merged
  }
  
  /**
   * Calculate duration of a time slot in minutes
   */
  private static getDurationMinutes(slot: TimeSlot): number {
    return (slot.end.getTime() - slot.start.getTime()) / (1000 * 60)
  }
  
  /**
   * Find optimal meeting times by scoring based on preferences
   */
  static rankFreeSlots(
    freeSlots: TimeSlot[],
    preferences: {
      preferredTimes?: { start: string, end: string }[]
      avoidTimes?: { start: string, end: string }[]
    } = {}
  ): Array<TimeSlot & { score: number }> {
    return freeSlots.map(slot => {
      let score = 100
      
      const slotStart = slot.start.getHours() + slot.start.getMinutes() / 60
      const slotEnd = slot.end.getHours() + slot.end.getMinutes() / 60
      
      // Prefer times between 9 AM and 6 PM
      if (slotStart >= 9 && slotEnd <= 18) {
        score += 20
      }
      
      // Penalize early morning (before 8 AM)
      if (slotStart < 8) {
        score -= 30
      }
      
      // Penalize late evening (after 9 PM)
      if (slotEnd > 21) {
        score -= 20
      }
      
      // Bonus for lunch time (12 PM - 2 PM)
      if (slotStart >= 12 && slotEnd <= 14) {
        score += 15
      }
      
      // Check preferred times
      if (preferences.preferredTimes) {
        for (const pref of preferences.preferredTimes) {
          const [prefStartHour, prefStartMin] = pref.start.split(':').map(Number)
          const [prefEndHour, prefEndMin] = pref.end.split(':').map(Number)
          const prefStart = prefStartHour + prefStartMin / 60
          const prefEnd = prefEndHour + prefEndMin / 60
          
          // Check if slot overlaps with preferred time
          if (slotStart < prefEnd && slotEnd > prefStart) {
            score += 30
          }
        }
      }
      
      return { ...slot, score }
    }).sort((a, b) => b.score - a.score)
  }
  
  /**
   * Filter free slots by day of week
   */
  static filterByDayOfWeek(slots: TimeSlot[], allowedDays: number[]): TimeSlot[] {
    return slots.filter(slot => allowedDays.includes(slot.start.getDay()))
  }
  
  /**
   * Generate availability blocks for caching
   */
  static async generateAvailabilityBlocks(
    userId: string,
    events: any[],
    dateRange: { start: Date, end: Date },
    prisma: any
  ) {
    const blocks: any[] = []
    
    // Iterate through each day in the range
    let currentDate = new Date(dateRange.start)
    
    while (currentDate <= dateRange.end) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      // Get events for this day
      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.startTime)
        const eventEnd = new Date(event.endTime)
        return (eventStart >= dayStart && eventStart <= dayEnd) ||
               (eventEnd >= dayStart && eventEnd <= dayEnd)
      })
      
      // Sort events by start time
      dayEvents.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      
      // Find free blocks
      let currentTime = new Date(dayStart)
      currentTime.setHours(7, 0, 0, 0) // Start at 7 AM
      
      for (const event of dayEvents) {
        const eventStart = new Date(event.startTime)
        
        if (eventStart > currentTime) {
          // There's a free block before this event
          blocks.push({
            userId,
            startTime: new Date(currentTime),
            endTime: new Date(eventStart),
            date: new Date(dayStart),
            isFree: true
          })
        }
        
        currentTime = new Date(event.endTime)
      }
      
      // Check for free time after last event
      const endOfDay = new Date(currentDate)
      endOfDay.setHours(23, 0, 0, 0)
      
      if (currentTime < endOfDay) {
        blocks.push({
          userId,
          startTime: new Date(currentTime),
          endTime: new Date(endOfDay),
          date: new Date(dayStart),
          isFree: true
        })
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Save blocks to database
    if (blocks.length > 0) {
      await prisma.availabilityBlock.createMany({
        data: blocks,
        skipDuplicates: true
      })
    }
    
    return blocks
  }
}

export { TimeSlot, UserSchedule }
