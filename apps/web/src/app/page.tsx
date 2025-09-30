"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Users, Clock, TrendingUp, BookOpen, Zap } from "lucide-react"

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SyncUp
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The intelligent social calendar for university students. 
            Automate scheduling, find common free time, and never miss a study session.
          </p>

          <div className="flex gap-4 justify-center">
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
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

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Stay Organized
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 bg-white rounded-xl p-8 shadow-md"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Built With Modern Technology</h2>
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
