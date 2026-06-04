import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, deleteJson, getJson, getUserRole, postJson } from '../api'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CloudUpload,
  Download,
  Eye,
  Info,
  MoreVertical,
  Plus,
  PlayCircle,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle
} from 'lucide-react'

const GROUP_STUDENTS_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups/one/students'
const GROUP_ONE_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups/one'
const GROUPS_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups'
const LESSONS_API = '/lessons'
const LESSONS_BY_GROUP_API = '/lessons/my/group'
const ATTENDANCE_API = '/attendance'
const ATTENDANCE_ALL_API = '/attendance/all'
const HOMEWORK_API = '/homework'
const FILES_API = '/files'
// Backend API kerak: guruh bo'yicha o'quv reja mavzulari ro'yxati.
// Masalan: GET /api/v1/lesson-plans/group/{groupId}
const getTodayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const WEEK_DAY_LABELS = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Chor',
  THURSDAY: 'Pay',
  FRIDAY: 'Ju',
  SATURDAY: 'Shan',
  SUNDAY: 'Ya',
  Dushanba: 'Du',
  Seshanba: 'Se',
  Chorshanba: 'Chor',
  Payshanba: 'Pay',
  Juma: 'Ju',
  Shanba: 'Shan',
  Yakshanba: 'Ya'
}

const lessonTabs = [
  { id: 'homework', label: 'Uyga vazifa' },
  { id: 'videos', label: 'Videolar' },
  { id: 'exams', label: 'Imtihonlar' },
  { id: 'journal', label: 'Jurnal' }
]

export default function GroupDetail({ groupId }) {
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [allLessons, setAllLessons] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonsLoaded, setLessonsLoaded] = useState(false)
  const [attendanceLoaded, setAttendanceLoaded] = useState(false)
  const [homeworkLoaded, setHomeworkLoaded] = useState(false)
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [mainTab, setMainTab] = useState('info')
  const [lessonTab, setLessonTab] = useState('exams')
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [lessonSource, setLessonSource] = useState('custom')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [lessonPlans] = useState([])
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoLessonId, setVideoLessonId] = useState('')
  const [videoName, setVideoName] = useState('')
  const [groupFiles, setGroupFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [homeworks, setHomeworks] = useState([])
  const [ownHomework, setOwnHomework] = useState(null)
  const [homeworkResults, setHomeworkResults] = useState([])
  const [selectedHomeworkId, setSelectedHomeworkId] = useState('')
  const [selectedResult, setSelectedResult] = useState(null)
  const [homeworkStatus, setHomeworkStatus] = useState('PENDING')
  const [loadingHomework, setLoadingHomework] = useState(false)
  const [savingHomework, setSavingHomework] = useState(false)
  const [checkingHomework, setCheckingHomework] = useState(false)
  const [homeworkForm, setHomeworkForm] = useState({
    title: '',
    description: '',
    lessonId: '',
    deadline: ''
  })
  const [checkForm, setCheckForm] = useState({
    studentId: '',
    grade: '',
    status: 'ACCEPTED',
    comment: ''
  })
  const [lessonForm, setLessonForm] = useState({
    date: getTodayDate(),
    topic: '',
    description: '',
    attendance: {}
  })

  const getInitials = (name = '') => {
    const initials = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('')

    return initials || 'O'
  }

  const normalizeStudents = (response) => {
    const data = response?.data || response
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data?.data)
          ? data.data
          : []

    return list.map(item => {
      const student = item?.student || item?.Student || item
      const name = student?.full_name || student?.name || student?.fullName || "Noma'lum"

      return {
        id: student?.id || item?.student_id || item?.id,
        name,
        phone: student?.phone || student?.phone_number || '-',
        email: student?.email || '-',
        birthDate: student?.birth_date || student?.birthDate || '-',
        initials: getInitials(name),
      }
    })
  }

  const getApiItems = (response) => {
    const data = response?.data || response
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.data?.schedules)) return data.data.schedules
    if (Array.isArray(data?.data?.lessons)) return data.data.lessons
    if (Array.isArray(data?.schedules)) return data.schedules
    if (Array.isArray(data?.lessons)) return data.lessons
    if (Array.isArray(data?.homeworks)) return data.homeworks
    if (Array.isArray(data?.homework)) return data.homework
    if (Array.isArray(data?.homeworkResults)) return data.homeworkResults
    if (Array.isArray(data?.submissions)) return data.submissions
    if (Array.isArray(data?.files)) return data.files
    if (Array.isArray(data?.data?.files)) return data.data.files
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.rows)) return data.rows
    return []
  }

  const normalizeHomeworks = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || item.homework_id || item.homeworkId,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      lessonId: item.lesson_id || item.lessonId || item.lesson?.id || item.Lesson?.id,
      title: item.title || item.name || item.topic || item.lesson?.topic || item.Lesson?.topic || 'Uyga vazifa',
      description: item.description || item.text || item.body || item.comment || '',
      fileUrl: item.file_url || item.fileUrl || item.url || item.attachment || item.file,
      deadline: item.deadline || item.due_date || item.dueDate || item.end_date || item.endDate || '',
      createdAt: item.created_at || item.createdAt || item.date || ''
    }))
  }

  const normalizeHomeworkResults = (response) => {
    return getApiItems(response).map(item => {
      const student = item.student || item.Student || item.user || item.User || {}
      const studentName = student.full_name || student.name || item.student_name || item.full_name || "Noma'lum"

      return {
        id: item.id || item.result_id || item.resultId || `${item.student_id || student.id}-${item.homework_id || item.homeworkId}`,
        studentId: item.student_id || item.studentId || student.id || item.user_id || item.userId,
        studentName,
        status: item.status || item.result_status || item.state || '-',
        grade: item.grade ?? item.score ?? item.mark ?? '-',
        comment: item.comment || item.feedback || item.teacher_comment || '',
        submittedAt: item.submitted_at || item.submittedAt || item.created_at || item.createdAt || '',
        fileUrl: item.file_url || item.fileUrl || item.url || item.attachment || item.file
          || (Array.isArray(item.files) ? item.files[0]?.url || item.files[0]?.file_url : ''),
        files: Array.isArray(item.files)
          ? item.files.map(file => buildFileUrl(file.url || file.file_url || file.path || file.location)).filter(Boolean)
          : Array.isArray(item.Files)
            ? item.Files.map(file => buildFileUrl(file.url || file.file_url || file.path || file.location)).filter(Boolean)
            : [item.file_url || item.fileUrl || item.url || item.attachment || item.file].filter(Boolean).map(buildFileUrl),
        homeworkComment: item.homework_comment || item.homeworkComment || item.answer || item.answer_text || item.text || ''
      }
    })
  }

  const normalizeResultStatus = (status) => String(status || '').toUpperCase()

  const buildFileUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url

    try {
      const origin = new URL(API_BASE).origin
      const normalized = url.startsWith('/') ? url : `/${url}`
      return `${origin}${normalized}`
    } catch {
      return url
    }
  }

  const getHomeworkStatusLabel = (status) => {
    const labels = {
      ACCEPTED: 'Qabul qilingan',
      REJECTED: 'Rad etilgan',
      PENDING: 'Kutmoqda',
      SUBMITTED: 'Topshirgan',
      NOT_SUBMITTED: 'Topshirmagan'
    }

    return labels[normalizeResultStatus(status)] || status || '-'
  }

  const normalizeFiles = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || item.file_id || item.fileId || item.name || item.original_name,
      lessonId: item.lesson_id || item.lessonId || item.lesson?.id || item.Lesson?.id,
      name: item.name || item.file_name || item.fileName || item.original_name || item.originalName || item.title || 'Fayl',
      lessonName: item.lesson?.topic || item.Lesson?.topic || item.lesson_name || item.lessonName || item.topic || '-',
      url: buildFileUrl(item.url || item.file_url || item.fileUrl || item.path || item.location),
      type: item.type || item.mime_type || item.mimeType || item.mimetype || '-',
      size: item.size || item.file_size || item.fileSize || '',
      createdAt: item.created_at || item.createdAt || item.uploaded_at || item.uploadedAt || item.date || ''
    }))
  }

  const normalizeSchedules = (response) => {
    return getApiItems(response).map(item => {
      const day = item.week_day || item.weekDay || item.day || item.days || item.weekday
      const startTime = item.start_time || item.startTime || item.time || item.lesson_time || ''
      const endTime = item.end_time || item.endTime || ''

      return {
        id: item.id || `${day}-${startTime}-${endTime}`,
        teacher: item.teacher_name || item.teacher || item.Teacher?.full_name || item.Teacher?.name || 'Teacher',
        room: item.room_name || item.room || item.Room?.name || '-',
        day,
        startTime,
        endTime,
        startDate: item.start_date || item.startDate || '',
        endDate: item.end_date || item.endDate || ''
      }
    })
  }

  const normalizeLessons = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || `${item.date || item.lesson_date}-${item.topic || item.title}`,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      date: item.date || item.lesson_date || item.created_at || item.createdAt || '',
      topic: item.topic || item.title || item.theme || item.name || '-',
      description: item.description || item.comment || item.note || '',
      attendanceCount: Array.isArray(item.attendance)
        ? item.attendance.length
        : Array.isArray(item.Attendance)
          ? item.Attendance.length
          : item.attendance_count || item.attendanceCount || 0
    }))
  }

  const normalizeAttendance = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || `${item.group_id || item.groupId}-${item.student_id || item.studentId}`,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      studentId: item.student_id || item.studentId || item.student?.id || item.Student?.id,
      isPresent: item.isPresent ?? item.is_present ?? item.present ?? false,
      createdAt: item.created_at || item.createdAt || item.date || ''
    }))
  }

  const filterGroupLessons = (items = []) => {
    return items.filter(lesson => !lesson.groupId || String(lesson.groupId) === String(groupId))
  }

  const filterGroupAttendance = (items = []) => {
    return items.filter(record => !record.groupId || String(record.groupId) === String(groupId))
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isNaN(date)) return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })
    return String(value)
  }

  const formatFileSize = (value) => {
    const size = Number(value)
    if (!size) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatScheduleDay = (value) => {
    if (!value) return '-'
    if (Array.isArray(value)) return value.map(day => WEEK_DAY_LABELS[day] || day).join('/')
    return WEEK_DAY_LABELS[value] || value
  }

  const getCourseName = (groupData) => {
    const course = groupData?.course || groupData?.Course || groupData?.course_name || groupData?.direction || groupData?.subject
    if (!course) return '-'
    if (typeof course === 'object') return course.name || course.title || course.course_name || '-'
    return course
  }

  const getGroupName = () => group?.name || group?.group_name || 'Guruh'

  const getOpenedDate = (groupData) => {
    return formatDate(
      groupData?.opened_at ||
      groupData?.open_date ||
      groupData?.start_date ||
      groupData?.created_at ||
      groupData?.createdAt
    )
  }

  const getScheduleSummary = () => {
    const scheduleItems = schedules.length > 0
      ? schedules
      : [{
          day: group?.week_day || group?.days,
          startTime: group?.start_time || group?.time || '',
          endTime: group?.end_time || ''
        }]

    const labels = scheduleItems
      .map(item => {
        const day = formatScheduleDay(item.day)
        const time = item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime
        return [day, time].filter(Boolean).join(' ')
      })
      .filter(label => label && label !== '-')

    return labels.length > 0 ? labels.join(', ') : '-'
  }

  const buildLessonDays = () => {
    const today = getTodayDate()
    const fallback = Array.from({ length: 13 }, (_, index) => {
      const date = new Date(`${today}T00:00:00`)
      date.setDate(date.getDate() + index)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    })
    const base = allLessons.length > 0
      ? Array.from(new Set([today, ...allLessons.map(lesson => lesson.date?.slice(0, 10)).filter(Boolean)]))
      : fallback

    return base.slice(0, 13).map(value => {
      const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
      return {
        value: String(value).slice(0, 10),
        month: !isNaN(date) ? date.toLocaleDateString('en-US', { month: 'short' }) : 'May',
        day: !isNaN(date) ? date.getDate() : value,
        completed: allLessons.some(lesson => lesson.date?.slice(0, 10) === String(value).slice(0, 10))
      }
    })
  }

  const handleLessonDaySelect = (day, index, openJournal = false) => {
    const selectedDate = String(day.value).slice(0, 10)
    setSelectedMonth(index)
    setLessonForm(prev => ({ ...prev, date: selectedDate }))
    if (openJournal) {
      setMainTab('lessons')
      setLessonTab('journal')
    }
  }

  const fetchGroupLessons = async () => {
    try {
      const response = await getJson(LESSONS_API)
      return filterGroupLessons(normalizeLessons(response))
    } catch {
      const response = await getJson(`${LESSONS_BY_GROUP_API}/${groupId}`)
      return normalizeLessons(response)
    }
  }

  const loadHomeworks = async (force = false) => {
    if (homeworkLoaded && !force) return homeworks
    setLoadingHomework(true)
    try {
      let normalized = []
      try {
        normalized = normalizeHomeworks(await getJson(`${HOMEWORK_API}/${groupId}`))
      } catch {
        normalized = normalizeHomeworks(await getJson(`${HOMEWORK_API}/all`))
          .filter(item => !item.groupId || String(item.groupId) === String(groupId))
      }

      setHomeworks(normalized)
      setHomeworkLoaded(true)
      const firstHomeworkId = normalized[0]?.id || ''
      setSelectedHomeworkId(prev => prev || firstHomeworkId)
      if (firstHomeworkId) await loadHomeworkResults(firstHomeworkId, homeworkStatus)
      return normalized
    } catch (err) {
      console.error('Homework load error', err)
      setHomeworks([])
      setHomeworkLoaded(true)
      return []
    } finally {
      setLoadingHomework(false)
    }
  }

  const loadOwnHomework = async (lessonId) => {
    if (!lessonId) return
    try {
      const response = await getJson(`${HOMEWORK_API}/own/${lessonId}`)
      setOwnHomework(normalizeHomeworks(response)[0] || response?.data || response)
    } catch (err) {
      console.error('Own homework load error', err)
      setOwnHomework(null)
    }
  }

  const loadHomeworkResults = async (homeworkId = selectedHomeworkId, status = homeworkStatus) => {
    if (!homeworkId) {
      setHomeworkResults([])
      return
    }

    const serverStatus = ['ACCEPTED', 'REJECTED', 'PENDING'].includes(status) ? status : ''
    const query = serverStatus ? `?status=${encodeURIComponent(serverStatus)}` : ''
    try {
      const response = await getJson(`/group/${groupId}/homework/${homeworkId}/results${query}`)
      setHomeworkResults(normalizeHomeworkResults(response))
    } catch (err) {
      console.error('Homework results load error', err)
      setHomeworkResults([])
    }
  }

  const loadStudentHomeworkResult = async (homeworkId, studentId) => {
    if (!homeworkId || !studentId) return
    try {
      const response = await getJson(`/group/${groupId}/homework/${homeworkId}/result/${studentId}`)
      const normalized = normalizeHomeworkResults(response)
      const result = normalized[0] || response?.data || response
      setSelectedResult(result)
      setCheckForm(prev => ({
        ...prev,
        studentId: result?.studentId || studentId || '',
        grade: result?.grade && result.grade !== '-' ? String(result.grade) : '',
        status: ['ACCEPTED', 'REJECTED', 'PENDING'].includes(normalizeResultStatus(result?.status)) ? normalizeResultStatus(result.status) : prev.status,
        comment: result?.comment || ''
      }))
    } catch (err) {
      console.error('Student homework result load error', err)
      setSelectedResult(null)
    }
  }

  const loadFiles = async (force = false) => {
    if (filesLoaded && !force) return groupFiles
    setLoadingFiles(true)
    try {
      const response = await getJson(`${FILES_API}/${groupId}`)
      const normalized = normalizeFiles(response)
      setGroupFiles(normalized)
      setFilesLoaded(true)
      return normalized
    } catch (err) {
      console.error('Group files load error', err)
      setGroupFiles([])
      setFilesLoaded(true)
      return []
    } finally {
      setLoadingFiles(false)
    }
  }

  const loadAttendance = async (force = false) => {
    if (attendanceLoaded && !force) return attendanceRecords
    try {
      const response = await getJson(ATTENDANCE_ALL_API)
      const normalized = filterGroupAttendance(normalizeAttendance(response))
      setAttendanceRecords(normalized)
      setAttendanceLoaded(true)
      return normalized
    } catch (err) {
      console.error('Attendance load error', err)
      setAttendanceRecords([])
      setAttendanceLoaded(true)
      return []
    }
  }

  const loadLessons = async (force = false) => {
    if (lessonsLoaded && !force) return allLessons
    try {
      const normalized = await fetchGroupLessons()
      setAllLessons(normalized)
      setLessonsLoaded(true)
      return normalized
    } catch (err) {
      console.error('Group lessons load error', err)
      setAllLessons([])
      setLessonsLoaded(true)
      return []
    }
  }

  const toggleAttendance = (studentId, isPresent) => {
    if (!canFillAttendance()) return
    setLessonForm(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: isPresent
      }
    }))
  }

  const getLessonStartTime = () => {
    return group?.start_time || group?.startTime || group?.time || schedules[0]?.startTime || '09:00'
  }

  const getLessonStartDate = () => {
    const [hour = '09', minute = '00'] = String(getLessonStartTime()).split(':')
    return new Date(`${lessonForm.date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
  }

  const isAttendanceTaken = () => {
    return attendanceRecords.some(record => String(record.createdAt || '').slice(0, 10) === lessonForm.date)
  }

  const getAttendanceWindowStatus = () => {
    const start = getLessonStartDate()
    if (!lessonForm.date || isNaN(start)) return { open: false, message: 'Dars sanasi yoki vaqti topilmadi.' }
    if (isAttendanceTaken()) return { open: false, message: 'Bu dars uchun davomat allaqachon qilingan.' }

    const now = new Date()
    const end = new Date(start.getTime() + 45 * 60 * 1000)

    if (now < start) return { open: false, message: `Davomat ${getLessonStartTime()} dan keyin ochiladi.` }
    if (now > end) return { open: false, message: 'Davomat vaqti tugagan. Dars boshlanganidan keyin 45 minut ichida qilish mumkin.' }
    return { open: true, message: 'Davomat ochiq.' }
  }

  const canFillAttendance = () => {
    const hasTopic = lessonSource === 'plan' ? Boolean(selectedPlanId) : Boolean(lessonForm.topic.trim())
    return hasTopic && getAttendanceWindowStatus().open
  }

  const isVideoFile = (row = {}) => {
    const value = `${row.type || ''} ${row.name || ''} ${row.url || ''}`.toLowerCase()
    return value.includes('video') || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/.test(value)
  }

  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    const selectedPlan = lessonPlans.find(plan => String(plan.id) === String(selectedPlanId))
    const topic = lessonSource === 'plan' ? selectedPlan?.title || selectedPlan?.topic || '' : lessonForm.topic.trim()
    if (savingLesson || !topic) return
    if (!canFillAttendance()) {
      alert(getAttendanceWindowStatus().message)
      return
    }

    setSavingLesson(true)
    try {
      await postJson(LESSONS_API, {
        group_id: Number(groupId) || groupId,
        date: lessonForm.date,
        lesson_date: lessonForm.date,
        topic,
        description: lessonForm.description
      })

      if (students.length > 0) {
        await Promise.all(students
          .filter(student => student.id)
          .map(student => postJson(ATTENDANCE_API, {
            group_id: Number(groupId) || groupId,
            student_id: Number(student.id) || student.id,
            date: lessonForm.date,
            isPresent: lessonForm.attendance[student.id] === true
          }))
        )
      }

      await loadLessons(true)
      if (attendanceLoaded) await loadAttendance(true)
      setLessonForm({
        date: lessonForm.date || getTodayDate(),
        topic: '',
        description: '',
        attendance: {}
      })
      setSelectedPlanId('')
    } catch (err) {
      console.error('Group lesson save error', err)
      alert(err.message || 'Dars jurnalini saqlashda xatolik yuz berdi.')
    } finally {
      setSavingLesson(false)
    }
  }

  const openVideoModal = () => {
    setVideoFile(null)
    setVideoLessonId(allLessons[0]?.id ? String(allLessons[0].id) : '')
    setVideoName('')
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setVideoFile(null)
    setVideoLessonId('')
    setVideoName('')
  }

  const handleVideoFile = (file) => {
    if (!file) return
    setVideoFile(file)
    setVideoName(file.name)
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!videoFile || !videoLessonId || !videoName.trim()) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('name', videoName.trim())

      await postJson(`${FILES_API}/group/${groupId}/upload?lessonId=${encodeURIComponent(videoLessonId)}`, formData)
      closeVideoModal()
      await loadFiles(true)
    } catch (err) {
      console.error('Group file upload error', err)
      alert(err.message || 'Fayl yuklashda xatolik yuz berdi.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault()
    if (savingHomework || !homeworkForm.title.trim()) return

    setSavingHomework(true)
    try {
      await postJson(HOMEWORK_API, {
        title: homeworkForm.title.trim(),
        description: homeworkForm.description,
        group_id: Number(groupId) || groupId,
        lesson_id: Number(homeworkForm.lessonId) || homeworkForm.lessonId || undefined,
        deadline: homeworkForm.deadline || undefined
      })
      setHomeworkForm({ title: '', description: '', lessonId: '', deadline: '' })
      await loadHomeworks(true)
    } catch (err) {
      console.error('Homework save error', err)
      alert(err.message || "Uy vazifa qo'shishda xatolik yuz berdi.")
    } finally {
      setSavingHomework(false)
    }
  }

  const handleHomeworkCheck = async (e) => {
    e.preventDefault()
    if (checkingHomework || !selectedHomeworkId || !checkForm.studentId) return

    setCheckingHomework(true)
    try {
      await postJson(`/group/${groupId}/homework/${selectedHomeworkId}/check`, {
        student_id: Number(checkForm.studentId) || checkForm.studentId,
        grade: checkForm.grade === '' ? undefined : Number(checkForm.grade) || checkForm.grade,
        status: checkForm.status,
        comment: checkForm.comment
      })
      setCheckForm({ studentId: '', grade: '', status: 'ACCEPTED', comment: '' })
      setSelectedResult(null)
      await loadHomeworkResults(selectedHomeworkId, homeworkStatus)
    } catch (err) {
      console.error('Homework check error', err)
      alert(err.message || 'Uy vazifani tekshirishda xatolik yuz berdi.')
    } finally {
      setCheckingHomework(false)
    }
  }

  const handleGradeChange = (value) => {
    const normalized = Math.max(0, Math.min(100, Number(value) || 0))
    setCheckForm(prev => ({
      ...prev,
      grade: String(normalized),
      status: normalized >= 60 ? 'ACCEPTED' : 'REJECTED'
    }))
  }

  const deleteGroup = async () => {
    if (!window.confirm("Haqiqatan ham bu guruhni o'chirmoqchimisiz?")) return

    try {
      await deleteJson(`${GROUPS_API}/${groupId}`)
      navigate('/groups')
    } catch (err) {
      console.error('Group delete error', err)
      alert(err.message || "Guruhni o'chirishda xatolik yuz berdi.")
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setAllLessons([])
      setAttendanceRecords([])
      setHomeworks([])
      setHomeworkResults([])
      setOwnHomework(null)
      setSelectedHomeworkId('')
      setSelectedResult(null)
      setGroupFiles([])
      setLessonsLoaded(false)
      setAttendanceLoaded(false)
      setHomeworkLoaded(false)
      setFilesLoaded(false)

      try {
        const [groupRes, studentsRes, schedulesRes] = await Promise.allSettled([
          getJson(`${GROUPS_API}/${groupId}`),
          getJson(`${GROUP_STUDENTS_API}/${groupId}`),
          getJson(`${GROUPS_API}/${groupId}/schedules`),
        ])

        if (groupRes.status === 'fulfilled') {
          setGroup(groupRes.value?.data || groupRes.value)
        } else {
          try {
            const fallbackGroup = await getJson(`${GROUP_ONE_API}/${groupId}`)
            setGroup(fallbackGroup?.data || fallbackGroup)
          } catch (err) {
            setGroup(null)
            console.error('Group detail load error', groupRes.reason || err)
          }
        }

        if (studentsRes.status === 'fulfilled') {
          setStudents(normalizeStudents(studentsRes.value))
        } else {
          setStudents([])
          console.error('Group students load error', studentsRes.reason)
        }

        if (schedulesRes.status === 'fulfilled') {
          setSchedules(normalizeSchedules(schedulesRes.value))
        } else {
          setSchedules([])
          console.error('Group schedules load error', schedulesRes.reason)
        }

      } catch (err) {
        console.error('Group detail load error', err)
      }

      setLoading(false)
    }

    load()
  }, [groupId])

  const handleMainTabChange = async (tab) => {
    setMainTab(tab)
    if (tab === 'lessons') {
      await loadLessons()
    }
    if (tab === 'attendance') {
      await loadAttendance()
    }
  }

  const handleLessonTabChange = async (tab) => {
    setLessonTab(tab)

    if (tab === 'homework') {
      const loadedLessons = await loadLessons()
      const firstLessonId = loadedLessons[0]?.id
      if (firstLessonId) {
        setHomeworkForm(prev => ({ ...prev, lessonId: prev.lessonId || String(firstLessonId) }))
        await loadOwnHomework(firstLessonId)
      }
      await loadHomeworks()
    }

    if (tab === 'videos') {
      await loadLessons()
      await loadFiles()
    }

    if (tab === 'journal') {
      await loadAttendance()
    }
  }

  if (loading) return <div className="students-card">Yuklanmoqda...</div>
  if (!group) return <div className="students-card">Guruh topilmadi</div>

  const lessonDays = buildLessonDays()
  const canEditAttendance = canFillAttendance()
  const attendanceWindow = getAttendanceWindowStatus()
  const userRole = getUserRole()
  const canManageHomework = userRole
    ? ['superadmin', 'admin', 'teacher', 'oqituvchi'].includes(userRole)
    : true
  const attendancePresentCount = attendanceRecords.filter(record => record.isPresent).length
  const attendanceAbsentCount = attendanceRecords.length - attendancePresentCount
  const examRows = allLessons.length > 0 ? allLessons : [
    { id: 7, topic: 'Examination', date: '2026-05-22', attendanceCount: 12, status: 'Faol' },
    { id: 6, topic: 'Examination', date: '2026-04-24', attendanceCount: 12, status: 'Tugagan' },
    { id: 5, topic: 'Examination', date: '2026-03-26', attendanceCount: 14, status: 'Tugagan' }
  ]
  const videoRows = groupFiles
  const submittedStudentIds = new Set(homeworkResults.map(row => String(row.studentId)).filter(Boolean))
  const notSubmittedRows = students
    .filter(student => student.id && !submittedStudentIds.has(String(student.id)))
    .map(student => ({
      id: `not-submitted-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      status: 'NOT_SUBMITTED',
      grade: '-',
      submittedAt: ''
    }))
  const visibleHomeworkRows = homeworkStatus === 'NOT_SUBMITTED'
    ? notSubmittedRows
    : homeworkStatus === 'SUBMITTED'
      ? homeworkResults
      : homeworkStatus
        ? homeworkResults.filter(row => normalizeResultStatus(row.status) === homeworkStatus)
        : [...homeworkResults, ...notSubmittedRows]
  const submittedCount = homeworkResults.length
  const pendingCount = homeworkResults.filter(row => normalizeResultStatus(row.status) === 'PENDING').length
  const selectedHomework = homeworks.find(item => String(item.id) === String(selectedHomeworkId))
  const selectedResultFiles = selectedResult?.files || []
  const selectedGrade = Number(checkForm.grade || 0)

  return (
    <div className="erp-group-page">
      <header className="erp-group-header">
        <div className="erp-title-row">
          <button className="erp-icon-btn" onClick={() => navigate('/groups')} aria-label="Orqaga">
            <ArrowLeft size={22} />
          </button>
          <h1>{getGroupName()}</h1>
          <span className="erp-status active">{group.status || 'Aktiv'}</span>
        </div>
        <div className="erp-header-actions">
          <button className="erp-outline-btn">
            <BarChart3 size={18} />
            Statistika
          </button>
          <button className="erp-danger-icon" title="Guruhni o'chirish" onClick={deleteGroup}>
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <nav className="erp-main-tabs">
        <button className={mainTab === 'info' ? 'active' : ''} onClick={() => handleMainTabChange('info')}>Ma'lumotlar</button>
        <button className={mainTab === 'lessons' ? 'active' : ''} onClick={() => handleMainTabChange('lessons')}>Guruh darsliklari</button>
        <button className={mainTab === 'attendance' ? 'active' : ''} onClick={() => handleMainTabChange('attendance')}>Akademik davomati</button>
      </nav>

      {mainTab === 'info' && (
        <section className="erp-info-layout">
          <article className="erp-panel">
            <div className="erp-panel-title">Guruh mentorlari</div>
            <div className="erp-mentor-list">
              {Array.isArray(group.teachers) && group.teachers.length > 0 ? group.teachers.map(teacher => {
                const teacherName = teacher.name || teacher.full_name || "Noma'lum"
                return (
                  <div key={teacher.id || teacherName} className="erp-mentor-card">
                    <div className="erp-avatar">{getInitials(teacherName)}</div>
                    <div>
                      <div className="erp-role">Teacher</div>
                      <strong>{teacherName}</strong>
                    </div>
                  </div>
                )
              }) : (
                <div className="erp-empty-inline">Mentorlar yo'q</div>
              )}
            </div>
          </article>

          <article className="erp-panel">
            <div className="erp-panel-title">Parametrlar</div>
            <div className="erp-param-list">
              <div><span>Kurs:</span><strong>{getCourseName(group)}</strong></div>
              <div><span>O'rtacha yosh:</span><strong>{group.avg_age || '-'}</strong></div>
              <div><span>O'quvchilar sig'imi:</span><strong>{group.student_limit || '-'}</strong></div>
              <div><span>Mavjud o'quvchilar:</span><strong>{students.length || group.students_count || 0}</strong></div>
              <div><span>Ochilgan sana:</span><strong>{getOpenedDate(group)}</strong></div>
              <div><span>Dars jadvali:</span><strong>{getScheduleSummary()}</strong></div>
            </div>
          </article>

          <article className="erp-panel erp-schedule-panel">
            <div className="erp-panel-title">Dars jadvali</div>
            <div className="erp-schedule-list">
              {(schedules.length > 0 ? schedules : [{ id: 'fallback', teacher: 'Teacher', day: group.week_day || group.days, startTime: group.start_time || group.time, endTime: group.end_time, room: group.room_name || '-' }]).map(item => (
                <div key={item.id} className="erp-schedule-row">
                  <strong>{item.teacher}</strong>
                  <span>{formatScheduleDay(item.day)}</span>
                  <span>{item.startTime || '-'} dan {item.endTime || '-'} gacha</span>
                  <span>{[item.startDate && formatDate(item.startDate), item.endDate && formatDate(item.endDate)].filter(Boolean).join(' - ') || '-'}</span>
                  <span>{item.room}</span>
                </div>
              ))}
            </div>
            <div className="erp-month-strip compact">
              {lessonDays.map((day, index) => (
                <button key={`${day.value}-${index}`} className={index === selectedMonth ? 'active' : day.completed ? 'muted' : ''} onClick={() => handleLessonDaySelect(day, index, true)}>
                  <span>{day.month}</span>
                  <strong>{day.day}</strong>
                </button>
              ))}
            </div>
          </article>
        </section>
      )}

      {mainTab === 'lessons' && (
        <section className="erp-lessons-layout">
          <div className="erp-section-head">
            <h2>Guruh darsliklari</h2>
            <div className="erp-sub-tabs">
              {lessonTabs.map(tab => (
                <button key={tab.id} className={lessonTab === tab.id ? 'active' : ''} onClick={() => handleLessonTabChange(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {lessonTab === 'videos' && canManageHomework && (
              <button className="erp-primary-btn" onClick={openVideoModal}>
                <Upload size={18} />
                Fayl yuklash
              </button>
            )}
            {lessonTab === 'exams' && <button className="erp-primary-btn">Yangi imtihon</button>}
          </div>

          {lessonTab === 'homework' && (
            <div className="erp-homework-grid">
              <div className="erp-panel erp-homework-preview">
                <div className="erp-breadcrumb">{getGroupName()} <span>/</span> Uyga vazifa</div>
                <div className="erp-homework-actions">
                  <select value={selectedHomeworkId} onChange={e => {
                    const nextHomeworkId = e.target.value
                    setSelectedHomeworkId(nextHomeworkId)
                    setSelectedResult(null)
                    loadHomeworkResults(nextHomeworkId, homeworkStatus)
                  }}>
                    <option value="">Vazifani tanlang</option>
                    {homeworks.map(item => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                  <select value={homeworkStatus} onChange={e => {
                    const nextStatus = e.target.value
                    setHomeworkStatus(nextStatus)
                    loadHomeworkResults(selectedHomeworkId, nextStatus)
                  }}>
                    <option value="">Barchasi</option>
                    <option value="SUBMITTED">Topshirganlar</option>
                    <option value="NOT_SUBMITTED">Topshirmaganlar</option>
                    <option value="PENDING">Kutayotganlar</option>
                    <option value="ACCEPTED">Qabul qilingan</option>
                    <option value="REJECTED">Rad etilgan</option>
                  </select>
                  <button className="erp-outline-btn" onClick={() => loadHomeworkResults()}>
                    <Eye size={18} />
                    Natijalar
                  </button>
                </div>

                <div className="erp-homework-summary">
                  <div><span>Topshirgan</span><strong>{submittedCount}</strong></div>
                  <div><span>Topshirmagan</span><strong>{notSubmittedRows.length}</strong></div>
                  <div><span>Kutmoqda</span><strong>{pendingCount}</strong></div>
                </div>

                {loadingHomework ? (
                  <div className="erp-empty-table">Uy vazifalar yuklanmoqda...</div>
                ) : homeworks.length > 0 ? (
                  <div className="erp-homework-list">
                    {homeworks.map(item => (
                      <article key={item.id || item.title} className="erp-task-card">
                        <div className="erp-task-head">
                          <h3>{item.title}</h3>
                          <span className="erp-status neutral">Lesson #{item.lessonId || '-'}</span>
                        </div>
                        <p>{item.description || "Tavsif yo'q"}</p>
                        <div className="erp-task-meta">
                          <span>Muddat: {formatDate(item.deadline)}</span>
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="erp-link-cell">
                              <Download size={18} />
                              Yuklab olish
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="erp-empty-table">Bu guruh uchun uy vazifa topilmadi.</div>
                )}

                {ownHomework && (
                  <div className="erp-own-homework">
                    <strong>Talaba uchun lesson bo'yicha vazifa</strong>
                    <span>{ownHomework.title || ownHomework.name || 'Uyga vazifa'}</span>
                    {(ownHomework.fileUrl || ownHomework.file_url || ownHomework.url) && (
                      <a href={ownHomework.fileUrl || ownHomework.file_url || ownHomework.url} target="_blank" rel="noreferrer">
                        Yuklab olish
                      </a>
                    )}
                  </div>
                )}
              </div>

              {canManageHomework && (
                <form className="erp-panel erp-homework-form" onSubmit={handleHomeworkSubmit}>
                  <div className="erp-panel-title"><Plus size={18} /> Yangi uy vazifa</div>
                  <label className="erp-field">
                    <span><b>*</b> Nomi</span>
                    <input value={homeworkForm.title} onChange={e => setHomeworkForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Masalan: React props mashqi" required />
                  </label>
                  <label className="erp-field">
                    <span>Dars</span>
                    <select value={homeworkForm.lessonId} onChange={e => setHomeworkForm(prev => ({ ...prev, lessonId: e.target.value }))}>
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic}</option>
                      ))}
                    </select>
                  </label>
                  <label className="erp-field">
                    <span>Muddat</span>
                    <input type="date" value={homeworkForm.deadline} onChange={e => setHomeworkForm(prev => ({ ...prev, deadline: e.target.value }))} />
                  </label>
                  <label className="erp-field">
                    <span>Tavsif</span>
                    <textarea value={homeworkForm.description} onChange={e => setHomeworkForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Vazifa matni..." />
                  </label>
                  <button className="erp-primary-btn" type="submit" disabled={savingHomework || !homeworkForm.title.trim()}>
                    {savingHomework ? 'Saqlanmoqda...' : "Qo'shish"}
                  </button>
                </form>
              )}

              <div className="erp-table-card">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>O'quvchi</th>
                      <th>Status</th>
                      <th>Baho</th>
                      <th>Topshirgan vaqti</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHomeworkRows.length > 0 ? visibleHomeworkRows.map((row, index) => (
                      <tr key={row.id || index}>
                        <td>{index + 1}</td>
                        <td>{row.studentName}</td>
                        <td><span className={`erp-status ${normalizeResultStatus(row.status) === 'NOT_SUBMITTED' || normalizeResultStatus(row.status) === 'REJECTED' ? 'neutral' : 'soft'}`}>{getHomeworkStatusLabel(row.status)}</span></td>
                        <td>{row.grade}</td>
                        <td>{formatDate(row.submittedAt)}</td>
                        <td>
                          <button className="erp-link-cell" onClick={() => {
                            setCheckForm(prev => ({ ...prev, studentId: row.studentId || '' }))
                            if (normalizeResultStatus(row.status) === 'NOT_SUBMITTED') {
                              setSelectedResult(row)
                              setCheckForm(prev => ({ ...prev, studentId: row.studentId || '', grade: '', status: 'PENDING', comment: '' }))
                            } else {
                              loadStudentHomeworkResult(selectedHomeworkId, row.studentId)
                            }
                          }}>
                            <Eye size={18} />
                            {canManageHomework ? 'Baholash' : "Ko'rish"}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6">Natijalar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {canManageHomework && selectedResult && (
                <form className="erp-homework-check-page" onSubmit={handleHomeworkCheck}>
                  <div className="erp-check-breadcrumb">
                    <button type="button" onClick={() => setSelectedResult(null)}>Kutayotganlar</button>
                    <span>/</span>
                    <strong>Uyga vazifa</strong>
                  </div>

                  <section className="erp-check-card">
                    <h2>Uy vazifasi</h2>
                    <div className="erp-check-note">
                      <span>Izoh:</span>
                      <p>{selectedHomework?.description || "Izoh yo'q"}</p>
                    </div>
                  </section>

                  <section className="erp-check-card erp-student-work-card">
                    <h2>{selectedResult.studentName || "O'quvchi"}</h2>
                    <div className="erp-student-work-meta">
                      <div><span>Vaqti:</span><strong>{formatDate(selectedResult.submittedAt)}</strong></div>
                      <div><span>Fayllar soni:</span><strong>{selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong></div>
                      <div><span>Status:</span><strong className="erp-waiting-badge">{getHomeworkStatusLabel(selectedResult.status)}</strong></div>
                    </div>
                    <div className="erp-submitted-files">
                      <strong>Fayl: {selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong>
                      <div className="erp-file-preview-row">
                        {(selectedResultFiles.length > 0 ? selectedResultFiles : [selectedResult.fileUrl].filter(Boolean)).map((file, index) => (
                          <a key={`${file}-${index}`} href={file} target="_blank" rel="noreferrer" className="erp-file-thumb">
                            <Download size={18} />
                            Fayl {index + 1}
                          </a>
                        ))}
                      </div>
                      <div className="erp-submission-comment">
                        <span>Uyga vazifa izohi:</span>
                        <p>{selectedResult.homeworkComment || selectedResult.comment || "Izoh yo'q"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="erp-check-card erp-grade-card">
                    <div className="erp-grade-info">
                      <Info size={24} />
                      <span>60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.</span>
                    </div>
                    <label className="erp-field">
                      <span>Ball</span>
                      <div className="erp-grade-row">
                        <input type="range" min="0" max="100" value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} />
                        <input type="number" min="0" max="100" value={checkForm.grade} onChange={e => handleGradeChange(e.target.value)} placeholder="60" />
                      </div>
                      <small>O'tish bali</small>
                    </label>
                    <label className="erp-field">
                      <span>Status</span>
                      <select value={checkForm.status} onChange={e => setCheckForm(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="ACCEPTED">Qabul qilingan</option>
                        <option value="REJECTED">Qaytarilgan</option>
                        <option value="PENDING">Kutmoqda</option>
                      </select>
                    </label>
                    <label className="erp-field">
                      <span>Izoh</span>
                      <textarea value={checkForm.comment} onChange={e => setCheckForm(prev => ({ ...prev, comment: e.target.value }))} placeholder="Izohingiz" />
                    </label>
                    <div className="erp-check-actions">
                      <button type="button" className="erp-outline-btn" onClick={() => setSelectedResult(null)}>Bekor qilish</button>
                      <button className="erp-primary-btn" type="submit" disabled={checkingHomework || !selectedHomeworkId || !checkForm.studentId}>
                        {checkingHomework ? 'Yuborilmoqda...' : 'Yuborish'}
                      </button>
                    </div>
                  </section>
                </form>
              )}
            </div>
          )}

          {lessonTab === 'videos' && (
            <div className="erp-table-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fayl nomi</th>
                    <th>Dars nomi</th>
                    <th>Turi</th>
                    <th>Hajmi</th>
                    <th>Yuklangan vaqti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFiles ? (
                    <tr>
                      <td colSpan="7">Fayllar yuklanmoqda...</td>
                    </tr>
                  ) : videoRows.length > 0 ? videoRows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        {row.url ? (
                          <div className="erp-file-actions">
                            {isVideoFile(row) && (
                              <button className="erp-link-cell" type="button" onClick={() => setPreviewVideo(row)}>
                                <PlayCircle size={18} />
                                Ko'rish
                              </button>
                            )}
                            <a className="erp-link-cell" href={row.url} target="_blank" rel="noreferrer">
                              <Download size={18} />
                              {row.name || 'Fayl'}
                            </a>
                          </div>
                        ) : (
                          <span className="erp-link-cell"><PlayCircle size={18} /> {row.name || row.topic || 'Fayl'}</span>
                        )}
                      </td>
                      <td>{row.lessonName || row.topic || '-'}</td>
                      <td><span className="erp-status neutral">{row.type || '-'}</span></td>
                      <td>{formatFileSize(row.size)}</td>
                      <td>{formatDate(row.createdAt || row.date)}</td>
                      <td><MoreVertical size={18} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7">Bu guruh uchun fayllar topilmadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {lessonTab === 'exams' && (
            <div className="erp-table-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mavzu</th>
                    <th><UserRound size={18} /></th>
                    <th><XCircle size={18} /></th>
                    <th>Status</th>
                    <th>Dars vaqti</th>
                    <th>Berilgan vaqt</th>
                    <th>E'lon qilingan vaqti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {examRows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{row.id || index + 1}</td>
                      <td><button className="erp-topic-link">{row.topic || 'Examination'}</button></td>
                      <td>{row.attendanceCount || students.length || 0}</td>
                      <td>0</td>
                      <td><span className={`erp-status ${row.status === 'Faol' ? 'soft' : 'neutral'}`}>{row.status || 'Tugagan'}</span></td>
                      <td>{formatDate(row.date)}<br />09:30</td>
                      <td>{formatDate(row.date)}<br />09:28</td>
                      <td>{row.status === 'Faol' ? '-' : formatDate(row.date)}</td>
                      <td><MoreVertical size={18} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lessonTab === 'journal' && (
            <div className="erp-journal">
              <div className="erp-month-strip">
                {lessonDays.map((day, index) => (
                  <button key={`${day.value}-${index}`} className={index === selectedMonth ? 'active' : day.completed ? 'muted' : ''} onClick={() => handleLessonDaySelect(day, index)}>
                    <span>{day.month}</span>
                    <strong>{day.day}</strong>
                  </button>
                ))}
              </div>

              <form className="erp-panel erp-attendance-form" onSubmit={handleLessonSubmit}>
                <div className="erp-panel-title">Yo'qlama va mavzu kiritish</div>
                <label className="erp-field">
                  <span><b>*</b> Sana</span>
                  <input type="date" value={lessonForm.date} onChange={e => setLessonForm(prev => ({ ...prev, date: e.target.value }))} required />
                </label>
                <div className="erp-radio-row">
                  <label>
                    <input
                      type="radio"
                      name="lesson-source"
                      checked={lessonSource === 'plan'}
                      onChange={() => setLessonSource('plan')}
                    />
                    O'quv reja bo'yicha
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="lesson-source"
                      checked={lessonSource === 'custom'}
                      onChange={() => setLessonSource('custom')}
                    />
                    Boshqa
                  </label>
                </div>

                {lessonSource === 'plan' ? (
                  <label className="erp-field">
                    <span><b>*</b> Mavzu</span>
                    <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required>
                      <option value="">O'quv reja API ulanmagan</option>
                      {lessonPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.title || plan.topic || plan.name}</option>
                      ))}
                    </select>
                    <small>Backenddan o'quv reja endpointini bersangiz, shu select real mavzular bilan to'ladi.</small>
                  </label>
                ) : (
                  <label className="erp-field">
                    <span><b>*</b> Mavzu</span>
                    <input value={lessonForm.topic} onChange={e => setLessonForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Mavzuni kiriting..." required />
                  </label>
                )}

                <label className="erp-field">
                  <span>Tavsif (ixtiyoriy)</span>
                  <textarea value={lessonForm.description} onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Dars haqida qo'shimcha ma'lumot..." />
                </label>

                <div className={`erp-attendance-note ${attendanceWindow.open ? 'open' : 'closed'}`}>
                  {attendanceWindow.message}
                </div>

                <div className="erp-attendance-table">
                  <div className="erp-attendance-head">
                    <span>#</span>
                    <span>O'quvchi ismi</span>
                    <span>Davomat</span>
                  </div>
                  {students.length > 0 ? students.map((student, index) => (
                    <div key={student.id || student.name} className="erp-attendance-row">
                      <span>{index + 1}</span>
                      <span className="erp-student-cell"><span className="erp-mini-avatar">{student.initials}</span>{student.name}</span>
                      <div className="erp-attendance-actions">
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`erp-attendance-choice ${lessonForm.attendance[student.id] === true ? 'present' : ''}`}
                          onClick={() => toggleAttendance(student.id, true)}
                        >
                          Keldi
                        </button>
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`erp-attendance-choice ${lessonForm.attendance[student.id] === false ? 'absent' : ''}`}
                          onClick={() => toggleAttendance(student.id, false)}
                        >
                          Kelmadi
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="erp-empty-table">Bu guruhda o'quvchilar topilmadi.</div>
                  )}
                </div>

                <div className="erp-form-actions">
                  <button type="button" className="erp-outline-btn" onClick={() => {
                    setLessonForm(prev => ({ ...prev, topic: '', description: '', attendance: {} }))
                    setSelectedPlanId('')
                  }}>Bekor qilish</button>
                  <button type="submit" className="erp-primary-btn purple" disabled={savingLesson || !canEditAttendance}>
                    {savingLesson ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {mainTab === 'attendance' && (
        <section className="erp-attendance-months">
          <div className="erp-attendance-summary">
            <div>
              <span>Umumiy yozuvlar</span>
              <strong>{attendanceRecords.length}</strong>
            </div>
            <div>
              <span>Kelgan</span>
              <strong>{attendancePresentCount}</strong>
            </div>
            <div>
              <span>Kelmagan</span>
              <strong>{attendanceAbsentCount}</strong>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((month, monthIndex) => (
            <div key={month} className="erp-month-block">
              <h2>{month}-o'quv oyi {monthIndex === 0 && <span>Joriy oy</span>}</h2>
              <div className="erp-month-strip wide">
                {lessonDays.map((day, index) => (
                  <button key={`${month}-${day.value}-${index}`} className={monthIndex === 0 && index < 7 ? 'muted' : ''}>
                    <span>{monthIndex === 0 ? 'Jan' : day.month}</span>
                    <strong>{monthIndex === 0 ? [2, 5, 7, 9, 12, 14, 16, 19, 21, 23, 26, 28, 30][index] : day.day}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {previewVideo && (
        <div className="erp-modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="erp-video-modal erp-video-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-video-modal-head">
              <h2>{previewVideo.name || 'Video'}</h2>
              <button onClick={() => setPreviewVideo(null)} aria-label="Yopish">
                <X size={22} />
              </button>
            </div>
            <div className="erp-video-preview-body">
              <video src={previewVideo.url} controls autoPlay />
            </div>
          </div>
        </div>
      )}

      {isVideoModalOpen && (
        <div className="erp-modal-overlay" onClick={closeVideoModal}>
          <div className="erp-video-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-video-modal-head">
              <h2>Fayl yuklash</h2>
              <button onClick={closeVideoModal} aria-label="Yopish">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleVideoUpload}>
              <label
                className="erp-video-dropzone"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  handleVideoFile(e.dataTransfer.files?.[0])
                }}
              >
                <input
                  type="file"
                  accept="*/*"
                  onChange={e => handleVideoFile(e.target.files?.[0])}
                />
                <span className="erp-upload-box">
                  <Upload size={38} />
                </span>
                <strong>Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</strong>
                <small>Darslik, rasm, video yoki qo'shimcha material fayllarini yuklash mumkin</small>
              </label>

              {videoFile && (
                <div className="erp-video-file-table">
                  <div className="erp-video-file-head">
                    <span>File name</span>
                    <span><b>*</b> Dars</span>
                    <span><b>*</b> Fayl nomi</span>
                    <span>Actions</span>
                  </div>
                  <div className="erp-video-file-row">
                    <span>{videoFile.name}</span>
                    <select value={videoLessonId} onChange={e => setVideoLessonId(e.target.value)} required>
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic || `Dars ${index + 1}`}</option>
                      ))}
                    </select>
                    <input value={videoName} onChange={e => setVideoName(e.target.value)} required />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null)
                        setVideoName('')
                        setVideoLessonId('')
                      }}
                      aria-label="Faylni olib tashlash"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="erp-video-modal-actions">
                <button type="button" onClick={closeVideoModal}>Bekor qilish</button>
                {videoFile && (
                  <button type="submit" disabled={uploadingFile || !videoLessonId || !videoName.trim()}>
                    {uploadingFile ? 'Yuklanmoqda...' : 'Faylni yuklash'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
