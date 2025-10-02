"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Users, Clock, TrendingUp, BookOpen, Zap } from "lucide-react"
import Image from "next/image"

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Calendar",
      description: "Automatically sync your university timetable and manage all your events in one place"
    },
    {
      icon: Users,
      title: "Find Common Time",
      description: "Instantly discover when you and your friends are all free for group activities"
    },
    {
      icon: Clock,
      title: "Availability Detection",
      description: "Advanced algorithms analyze schedules to find optimal meeting times"
    },
    {
      icon: BookOpen,
      title: "Assessment Tracking",
      description: "Track deadlines and automatically schedule study sessions before exams"
    },
    {
      icon: TrendingUp,
      title: "Schedule Optimization",
      description: "AI-powered suggestions to balance study, social life, and rest"
    },
    {
      icon: Zap,
      title: "DevSoc Integration",
      description: "Seamlessly sync with UNSW course data via DevSoc API"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-2">
             Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SyncUp
              </span>
            </h1>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Plan less, live more
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              The intelligent social calendar for university students. 
              Automate scheduling, find common free time, and never miss a study session.
            </p>

            <div className="flex gap-4">
              <Link
                href="/calendar"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Open Calendar
              </Link>
              <a
                href="http://localhost:4000/graphql"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-gray-800 border-2 border-gray-300 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                GraphQL Playground
              </a>
            </div>
          </motion.div>

          {/* Right Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <Image 
                src="/images/hero.png"
                alt="SyncUp Calendar Preview"
                width={400}
                height={384}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-20"
        >
          <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Built With Modern Technology</h2>
          <div className="bg-white rounded-xl p-8 shadow-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Next.js", desc: "App Router" },
                { name: "GraphQL", desc: "Apollo Server" },
                { name: "PostgreSQL", desc: "Prisma ORM" },
                { name: "TypeScript", desc: "Type Safety" }
              ].map((tech, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{tech.name}</div>
                  <div className="text-sm text-gray-600">{tech.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Banner Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <Image 
              src="/images/banner.png"
              alt="SyncUp Banner"
              width={800}
              height={320}
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Everything You Need to Stay Organized
          </h2>
          {/* Large Calendar Grid Background with Features */}
          <div className="relative w-full mx-auto px-4">
            {/* Calendar Grid Background */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Days Header */}
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-6 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-700">Time</span>
                </div>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="p-6 bg-gray-50 text-center text-lg font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Time Slots Grid - Extended to 6:00 PM */}
              {['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((time, timeIndex) => (
                <div key={time} className="grid grid-cols-8 border-b border-gray-200 last:border-b-0 min-h-[140px]">
                  <div className="p-6 bg-gray-50 border-r border-gray-200 text-lg font-medium text-gray-600 flex items-start justify-center">
                    {time}
                  </div>
                  {[...Array(7)].map((_, dayIndex) => {
                    // Distribute features across different rows and columns - adjusted for 6-row calendar
                    const featurePositions = [
                      { row: 1, col: 1 }, // Monday 1:00 PM (Smart Calendar)
                      { row: 1, col: 3 }, // Wednesday 1:00 PM (Find Common Time)
                      { row: 2, col: 5 }, // Friday 2:00 PM (Availability Detection)
                      { row: 4, col: 0 }, // Monday 4:00 PM (Assessment Tracking)
                      { row: 4, col: 2 }, // Tuesday 4:00 PM (Schedule Optimization)
                      { row: 0, col: 4 }, // Thursday 12:00 PM (DevSoc Integration)
                    ];
                    
                    const currentPosition = { row: timeIndex, col: dayIndex };
                    const featureIndex = featurePositions.findIndex(pos => 
                      pos.row === currentPosition.row && pos.col === currentPosition.col
                    );
                    
                    const hasFeature = featureIndex !== -1;
                    const feature = hasFeature ? features[featureIndex] : null;
                    
                    return (
                      <div key={dayIndex} className="border-r border-gray-200 last:border-r-0 p-4 min-h-[140px] relative">
                        {hasFeature && feature && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 + 0.1 * featureIndex }}
                            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-5 text-white shadow-md hover:shadow-lg transition-all flex flex-col cursor-pointer hover:scale-105 absolute top-2 left-2 right-2 z-10"
                            style={{
                              height: 'auto',
                              minHeight: '160px',
                              maxHeight: '400px' // Increased to allow more downward extension
                            }}
                          >
                            <div className="mb-4">
                              <div className="w-12 h-12 bg-white/20 rounded-md flex items-center justify-center mb-4">
                                <feature.icon className="w-7 h-7 text-white" />
                              </div>
                              <h3 className="text-lg font-bold mb-3 leading-tight">{feature.title}</h3>
                            </div>
                            <p className="text-base opacity-90 leading-relaxed flex-1">{feature.description}</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
        >
          {[
            { value: "10+", label: "GraphQL Queries" },
            { value: "15+", label: "Database Models" },
            { value: "100%", label: "Open Source" }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>


        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start organizing your schedule and finding time with friends today
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/calendar"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Launch SyncUp
              </Link>
              <a
                href="/SYNCUP_README.md"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
