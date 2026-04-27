'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap,
  BookOpen,
  Award,
  Play,
  Clock,
  Star,
  ChevronRight,
  CheckCircle2,
  Lock,
  Trophy,
  Target,
  Zap,
  Shield,
  Cpu,
  Car,
  Wrench,
  Gauge,
  Radio,
  Brain,
  Video,
  FileQuestion,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

interface Course {
  id: string
  title: string
  icon: React.ReactNode
  difficulty: Difficulty
  duration: string
  rating: number
  lessons: number
  completed: boolean
  progress: number
  color: string
  description: string
}

interface Certification {
  id: string
  name: string
  status: 'active' | 'expired' | 'available'
  expiryDate?: string
  score?: number
}

interface VideoTutorial {
  id: string
  title: string
  duration: string
  category: string
  thumbnail: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  earned: boolean
  date?: string
  color: string
}

interface LearningPath {
  id: string
  name: string
  progress: number
  courses: number
  completedCourses: number
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const courses: Course[] = [
  { id: '1', title: 'OBD-II Fundamentals', icon: <Car className="h-5 w-5" />, difficulty: 'Beginner', duration: '4 hrs', rating: 4.8, lessons: 12, completed: true, progress: 100, color: '#10b981', description: 'Master the basics of OBD-II protocols, DTC codes, and standard parameters.' },
  { id: '2', title: 'CAN Bus Protocols', icon: <Radio className="h-5 w-5" />, difficulty: 'Intermediate', duration: '6 hrs', rating: 4.6, lessons: 18, completed: false, progress: 67, color: '#00d4ff', description: 'Deep dive into Controller Area Network bus architecture and messaging.' },
  { id: '3', title: 'ECU Programming', icon: <Cpu className="h-5 w-5" />, difficulty: 'Advanced', duration: '10 hrs', rating: 4.9, lessons: 24, completed: false, progress: 35, color: '#ef4444', description: 'Learn ECU flash programming, calibration, and firmware update procedures.' },
  { id: '4', title: 'ADAS Calibration', icon: <Shield className="h-5 w-5" />, difficulty: 'Advanced', duration: '8 hrs', rating: 4.7, lessons: 16, completed: false, progress: 12, color: '#8b5cf6', description: 'Advanced driver assistance system calibration and sensor alignment.' },
  { id: '5', title: 'EV Diagnostics', icon: <Zap className="h-5 w-5" />, difficulty: 'Intermediate', duration: '7 hrs', rating: 4.5, lessons: 15, completed: false, progress: 0, color: '#f59e0b', description: 'Electric vehicle high-voltage system diagnostics and safety protocols.' },
  { id: '6', title: 'Performance Tuning', icon: <Gauge className="h-5 w-5" />, difficulty: 'Advanced', duration: '12 hrs', rating: 4.8, lessons: 28, completed: false, progress: 0, color: '#ef4444', description: 'Engine mapping, turbo calibration, and performance optimization techniques.' },
  { id: '7', title: 'Security Systems', icon: <Shield className="h-5 w-5" />, difficulty: 'Intermediate', duration: '5 hrs', rating: 4.4, lessons: 14, completed: false, progress: 0, color: '#f59e0b', description: 'Vehicle immobilizer, key programming, and anti-theft system diagnostics.' },
  { id: '8', title: 'Advanced Diagnostics', icon: <Brain className="h-5 w-5" />, difficulty: 'Advanced', duration: '9 hrs', rating: 4.7, lessons: 22, completed: false, progress: 0, color: '#8b5cf6', description: 'Complex multi-system diagnostics, inter-module communication analysis.' },
]

const certifications: Certification[] = [
  { id: '1', name: 'OBD-II Certified Technician', status: 'active', expiryDate: '2027-03-15', score: 94 },
  { id: '2', name: 'CAN Bus Specialist', status: 'active', expiryDate: '2027-06-22', score: 88 },
  { id: '3', name: 'ECU Programming Expert', status: 'available' },
  { id: '4', name: 'ADAS Calibration Pro', status: 'available' },
  { id: '5', name: 'EV Safety Certified', status: 'expired', expiryDate: '2025-11-01', score: 82 },
]

const videoTutorials: VideoTutorial[] = [
  { id: '1', title: 'Reading Live Data Streams', duration: '18 min', category: 'OBD-II', thumbnail: '📊' },
  { id: '2', title: 'CAN Bus Signal Analysis', duration: '25 min', category: 'CAN Bus', thumbnail: '📡' },
  { id: '3', title: 'ECU Flash Procedure Walkthrough', duration: '32 min', category: 'ECU Programming', thumbnail: '🔧' },
  { id: '4', title: 'Radar Sensor Calibration Demo', duration: '22 min', category: 'ADAS', thumbnail: '🎯' },
  { id: '5', title: 'HV Battery Health Assessment', duration: '28 min', category: 'EV', thumbnail: '🔋' },
  { id: '6', title: 'Lambda Control Diagnostics', duration: '15 min', category: 'Engine', thumbnail: '⚙️' },
]

const achievements: Achievement[] = [
  { id: '1', name: 'First Scan', description: 'Complete your first DTC scan', icon: <Zap className="h-4 w-4" />, earned: true, date: '2025-08-12', color: '#00d4ff' },
  { id: '2', name: 'Bus Master', description: 'Monitor all CAN bus lines', icon: <Radio className="h-4 w-4" />, earned: true, date: '2025-09-05', color: '#10b981' },
  { id: '3', name: 'Code Breaker', description: 'Clear 100 DTC codes', icon: <Wrench className="h-4 w-4" />, earned: true, date: '2025-10-18', color: '#f59e0b' },
  { id: '4', name: 'Flash Expert', description: 'Complete 10 ECU flashes', icon: <Cpu className="h-4 w-4" />, earned: false, color: '#8b5cf6' },
  { id: '5', name: 'ADAS Pro', description: 'Calibrate 5 ADAS systems', icon: <Shield className="h-4 w-4" />, earned: false, color: '#ef4444' },
  { id: '6', name: 'Scholar', description: 'Complete all beginner courses', icon: <GraduationCap className="h-4 w-4" />, earned: true, date: '2025-11-30', color: '#00d4ff' },
]

const learningPaths: LearningPath[] = [
  { id: '1', name: 'Diagnostics Professional', progress: 72, courses: 5, completedCourses: 3 },
  { id: '2', name: 'Tuning Specialist', progress: 15, courses: 4, completedCourses: 0 },
  { id: '3', name: 'EV Technician', progress: 0, courses: 3, completedCourses: 0 },
]

const quizzes = [
  { id: '1', title: 'OBD-II Protocol Basics', questions: 20, duration: '15 min', difficulty: 'Beginner' as Difficulty },
  { id: '2', title: 'CAN Bus Messaging', questions: 25, duration: '20 min', difficulty: 'Intermediate' as Difficulty },
  { id: '3', title: 'ECU Flash Procedures', questions: 30, duration: '25 min', difficulty: 'Advanced' as Difficulty },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

const difficultyBadge: Record<Difficulty, string> = {
  Beginner: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
  Intermediate: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
  Advanced: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
}

const recommendedCourses = courses.filter((c) => !c.completed && c.progress === 0).slice(0, 3)

// ── Main Component ──────────────────────────────────────────────────────────

export function TrainingView() {
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications' | 'videos' | 'quizzes'>('courses')

  const totalCompleted = courses.filter((c) => c.completed).length
  const totalInProgress = courses.filter((c) => c.progress > 0 && !c.completed).length
  const overallProgress = Math.round(
    courses.reduce((acc, c) => acc + c.progress, 0) / courses.length
  )

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-[#e2e8f0]">Training Academy</h1>
          </div>
          <p className="text-xs text-[#64748b]">Learn, get certified, and advance your diagnostic skills</p>
        </div>
        <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-xs font-semibold self-start">
          {overallProgress}% Complete
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Completed</div>
            <div className="text-2xl font-bold text-[#10b981]">{totalCompleted}</div>
            <div className="text-[10px] text-[#475569]">Courses done</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">In Progress</div>
            <div className="text-2xl font-bold text-[#f59e0b]">{totalInProgress}</div>
            <div className="text-[10px] text-[#475569]">Active courses</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Certifications</div>
            <div className="text-2xl font-bold text-[#8b5cf6]">
              {certifications.filter((c) => c.status === 'active').length}
            </div>
            <div className="text-[10px] text-[#475569]">Active certs</div>
          </CardContent>
        </Card>
        <Card className="bg-[#151d2b] border-[#1e2a3a]">
          <CardContent className="p-4">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">Achievements</div>
            <div className="text-2xl font-bold text-[#00d4ff]">
              {achievements.filter((a) => a.earned).length}/{achievements.length}
            </div>
            <div className="text-[10px] text-[#475569]">Badges earned</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[#1e2a3a] pb-1">
            {(['courses', 'certifications', 'videos', 'quizzes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium transition-all rounded-t-md capitalize ${
                  activeTab === tab
                    ? 'text-[#00d4ff] bg-[#151d2b] border-b-2 border-[#00d4ff]'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${course.color}15` }}
                        >
                          <span style={{ color: course.color }}>{course.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#e2e8f0] leading-tight">{course.title}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge className={`${difficultyBadge[course.difficulty]} text-[8px] border`}>
                              {course.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {course.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#10b981] flex-shrink-0" />
                      ) : course.progress > 0 ? (
                        <Play className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-[#475569] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-relaxed">{course.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#475569]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {course.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-[#f59e0b]" />
                        {course.rating}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-[#64748b]">Progress</span>
                        <span className="text-[9px] font-mono" style={{ color: course.color }}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${course.progress}%`,
                            backgroundColor: course.color,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] hover:bg-[#1e2a3a] gap-1"
                      style={{ color: course.completed ? '#10b981' : course.color }}
                    >
                      {course.completed ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Review Course
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <Play className="h-3 w-3" />
                          Continue ({course.progress}%)
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          Start Course
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <Card key={cert.id} className="bg-[#151d2b] border-[#1e2a3a]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            cert.status === 'active'
                              ? 'bg-[#10b981]/15'
                              : cert.status === 'expired'
                              ? 'bg-[#ef4444]/15'
                              : 'bg-[#8b5cf6]/15'
                          }`}
                        >
                          <Award
                            className={`h-5 w-5 ${
                              cert.status === 'active'
                                ? 'text-[#10b981]'
                                : cert.status === 'expired'
                                ? 'text-[#ef4444]'
                                : 'text-[#8b5cf6]'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#e2e8f0]">{cert.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {cert.status === 'active' && (
                              <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 text-[9px] border">
                                Active
                              </Badge>
                            )}
                            {cert.status === 'expired' && (
                              <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30 text-[9px] border">
                                Expired
                              </Badge>
                            )}
                            {cert.status === 'available' && (
                              <Badge className="bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/30 text-[9px] border">
                                Available
                              </Badge>
                            )}
                            {cert.score && (
                              <span className="text-[10px] text-[#475569]">Score: {cert.score}%</span>
                            )}
                            {cert.expiryDate && (
                              <span className="text-[10px] text-[#475569]">
                                {cert.status === 'expired' ? 'Expired' : 'Expires'}: {cert.expiryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] border-[#1e2a3a] bg-[#0f1923] gap-1"
                        style={{
                          color: cert.status === 'active' ? '#10b981' : cert.status === 'expired' ? '#f59e0b' : '#8b5cf6',
                        }}
                      >
                        {cert.status === 'active' ? 'View' : cert.status === 'expired' ? 'Renew' : 'Take Exam'}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-3">
              {videoTutorials.map((video) => (
                <Card key={video.id} className="bg-[#151d2b] border-[#1e2a3a] hover:border-[#00d4ff]/30 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-24 rounded-lg bg-[#1e2a3a] flex items-center justify-center text-2xl flex-shrink-0 relative">
                        {video.thumbnail}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#e2e8f0]">{video.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 text-[9px] border">
                            {video.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[10px] text-[#475569]">
                            <Clock className="h-3 w-3" />
                            {video.duration}
                          </span>
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-[#64748b] flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="bg-[#151d2b] border-[#1e2a3a]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#f59e0b]/15 flex items-center justify-center">
                          <FileQuestion className="h-5 w-5 text-[#f59e0b]" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#e2e8f0]">{quiz.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${difficultyBadge[quiz.difficulty]} text-[9px] border`}>
                              {quiz.difficulty}
                            </Badge>
                            <span className="text-[10px] text-[#475569]">{quiz.questions} questions</span>
                            <span className="text-[10px] text-[#475569]">{quiz.duration}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-[#f59e0b] text-[#0f1923] hover:bg-[#d97706] font-semibold gap-1"
                      >
                        Start Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Learning Path Progress */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00d4ff]" />
                Learning Paths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {learningPaths.map((path) => (
                <div key={path.id} className="bg-[#0f1923] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#e2e8f0]">{path.name}</span>
                    <span className="text-[10px] font-mono text-[#00d4ff]">{path.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-[#00d4ff] rounded-full transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-[#475569]">
                    {path.completedCourses} of {path.courses} courses completed
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievement Badges */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#f59e0b]" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      achievement.earned ? 'bg-[#0f1923]' : 'bg-[#0f1923] opacity-40'
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: achievement.earned ? `${achievement.color}20` : '#1e2a3a',
                      }}
                    >
                      <span style={{ color: achievement.earned ? achievement.color : '#475569' }}>
                        {achievement.icon}
                      </span>
                    </div>
                    <span className="text-[8px] text-center text-[#94a3b8] leading-tight">{achievement.name}</span>
                    {achievement.earned && (
                      <span className="text-[7px] text-[#475569]">{achievement.date}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          <Card className="bg-[#151d2b] border-[#1e2a3a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#e2e8f0] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                Recommended For You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 bg-[#0f1923] rounded-lg p-2.5 hover:bg-[#1e2a3a]/50 transition-colors cursor-pointer"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${course.color}15` }}
                  >
                    <span style={{ color: course.color }}>{course.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#e2e8f0] truncate">{course.title}</div>
                    <div className="flex items-center gap-2 text-[9px] text-[#475569]">
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.difficulty}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
