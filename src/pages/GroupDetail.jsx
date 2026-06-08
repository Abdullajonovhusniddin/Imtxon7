import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, deleteJson, getJson, getUserRole, postJson } from '../api'
import { createTranslator } from '../i18n'
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

const GROUP_STUDENTS_API = '/groups/one/students'
const GROUP_ONE_API = '/groups/one'
const GROUPS_API = '/groups'
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

const cn = (...classes) => classes.filter(Boolean).join(' ')

const tw = {
  page: 'w-full max-w-screen-2xl mx-auto flex min-h-0 flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100',
  header: 'flex flex-wrap items-center justify-between gap-4',
  titleRow: 'flex min-w-0 items-center gap-3',
  iconBtn: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
  title: 'truncate text-2xl font-bold leading-tight text-slate-950 dark:text-white',
  statusActive: 'inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20',
  headerActions: 'flex items-center gap-2',
  outlineBtn: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  primaryBtn: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50',
  purpleBtn: 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-violet-600 bg-violet-600 px-4 text-sm font-bold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50',
  dangerIcon: 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  mainTabs: 'flex w-full max-w-full flex-wrap gap-3 overflow-x-auto border-b border-slate-200 pb-1 dark:border-slate-800',
  mainTab: 'relative whitespace-nowrap bg-transparent px-3 py-3 text-sm font-bold text-slate-500 transition hover:text-slate-900 dark:text-white dark:hover:text-slate-100',
  mainTabActive: 'text-violet-600 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-violet-600 dark:text-violet-300',
  infoLayout: 'grid grid-cols-1 gap-5 lg:grid-cols-2',
  panel: 'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
  panelPad: 'rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
  panelTitle: 'flex items-center gap-2 rounded-t-lg bg-blue-500 px-5 py-4 text-base font-bold text-white',
  panelTitlePlain: 'mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white',
  mentorList: 'flex flex-wrap gap-4 p-5',
  mentorCard: 'flex min-w-[190px] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950',
  avatar: 'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-sm font-black text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  role: 'text-xs font-bold text-emerald-600 dark:text-emerald-300',
  empty: 'rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400',
  paramList: 'divide-y divide-slate-100 p-5 dark:divide-slate-800 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-4 [&>div]:py-3 [&_span]:text-sm [&_span]:font-semibold [&_span]:text-slate-500 [&_strong]:text-right [&_strong]:text-sm [&_strong]:font-black [&_strong]:text-slate-900 dark:[&_strong]:text-white',
  schedulePanel: 'lg:col-span-2',
  scheduleList: 'm-5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800',
  scheduleRow: 'grid min-w-full grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,.8fr)] gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 dark:border-slate-800 [&_span]:text-slate-600 dark:[&_span]:text-slate-300',
  monthStrip: 'm-5 flex gap-2 overflow-x-auto pb-1',
  monthBtn: 'grid h-14 min-w-14 place-items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-violet-500/10',
  monthBtnActive: 'border-violet-500 bg-violet-600 text-white hover:bg-violet-600 dark:border-violet-400 dark:bg-violet-500',
  monthBtnMuted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  lessonsLayout: 'flex flex-col gap-5',
  sectionHead: 'flex flex-wrap items-center justify-between gap-3',
  subTabs: 'flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800',
  subTab: 'rounded-md px-4 py-2 text-sm font-bold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white',
  subTabActive: 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white',
  homeworkGrid: 'grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]',
  breadcrumb: 'mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400',
  controlRow: 'mb-4 flex flex-wrap items-center gap-3 [&_select]:min-h-10 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:font-semibold dark:[&_select]:border-slate-800 dark:[&_select]:bg-slate-950',
  summary: 'mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 [&>div]:rounded-lg [&>div]:border [&>div]:border-slate-200 [&>div]:bg-slate-50 [&>div]:p-4 dark:[&>div]:border-slate-800 dark:[&>div]:bg-slate-950 [&_span]:text-xs [&_span]:font-bold [&_span]:uppercase [&_span]:text-slate-500 [&_strong]:mt-1 [&_strong]:block [&_strong]:text-2xl [&_strong]:font-black',
  taskList: 'grid gap-3',
  taskCard: 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950',
  taskHead: 'mb-2 flex items-start justify-between gap-3 [&_h3]:text-base [&_h3]:font-black',
  taskMeta: 'mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500',
  field: 'flex flex-col gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 [&_b]:text-rose-500 [&_input]:min-h-10 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:text-sm [&_input]:font-semibold [&_input]:outline-none [&_input:focus]:border-emerald-500 [&_input:focus]:ring-4 [&_input:focus]:ring-emerald-500/10 dark:[&_input]:border-slate-800 dark:[&_input]:bg-slate-950 [&_select]:min-h-10 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 dark:[&_select]:border-slate-800 dark:[&_select]:bg-slate-950 [&_textarea]:min-h-24 [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:p-3 [&_textarea]:outline-none [&_textarea:focus]:border-emerald-500 [&_textarea:focus]:ring-4 [&_textarea:focus]:ring-emerald-500/10 dark:[&_textarea]:border-slate-800 dark:[&_textarea]:bg-slate-950 [&_small]:text-xs [&_small]:text-slate-500',
  tableCard: 'overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
  table: 'min-w-[980px] w-full border-collapse text-left text-sm [&_th]:border-b [&_th]:border-slate-200 [&_th]:px-5 [&_th]:py-4 [&_th]:font-black [&_th]:text-slate-500 dark:[&_th]:border-slate-800 [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-5 [&_td]:py-4 dark:[&_td]:border-slate-800 [&_tbody_tr:nth-child(even)_td]:bg-slate-50 dark:[&_tbody_tr:nth-child(even)_td]:bg-slate-950/60',
  linkCell: 'inline-flex items-center gap-2 border-0 bg-transparent p-0 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-300',
  statusSoft: 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  statusNeutral: 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export default function GroupDetail({ groupId, language = 'uz' }) {
  const navigate = useNavigate()
  const t = createTranslator(language)
  const lessonTabs = [
    { id: 'homework', label: t('pages.homework') },
    { id: 'videos', label: t('pages.videos') },
    { id: 'exams', label: t('pages.exams') },
    { id: 'journal', label: t('pages.journal') }
  ]
  const [group, setGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [allLessons, setAllLessons] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
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
  const [homeworkStatus, setHomeworkStatus] = useState('')
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
      ACCEPTED: t('homework.accepted'),
      REJECTED: t('homework.statusRejected'),
      PENDING: t('homework.pending'),
      SUBMITTED: t('homework.submitted'),
      NOT_SUBMITTED: t('homework.notSubmitted')
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

  const getGroupName = () => group?.name || group?.group_name || t('pages.groups')

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
      try {
        if (window && window.opener && !window.opener.closed) {
          try { window.opener.location.reload() } catch (e) { }
          try { window.close() } catch (e) { }
        }
      } catch (e) {
        // ignore
      }
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
    if (searchParams.get('newHomework') === '1') {
      setMainTab('lessons')
      setLessonTab('homework')
    }

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

  const openHomeworkInNewWindow = () => {
    const url = `${window.location.pathname}?newHomework=1`
    window.open(url, '_blank')
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
    <div className={tw.page}>
      <header className={tw.header}>
        <div className={tw.titleRow}>
          <button className={tw.iconBtn} onClick={() => navigate('/groups')} aria-label="Orqaga">
            <ArrowLeft size={22} />
          </button>
          <h1 className={tw.title}>{getGroupName()}</h1>
          <span className={tw.statusActive}>{group.status || 'Aktiv'}</span>
        </div>
        <div className={tw.headerActions}>
          <button className={tw.outlineBtn}>
            <BarChart3 size={18} />
            Statistika
          </button>
          <button className={tw.dangerIcon} title="Guruhni o'chirish" onClick={deleteGroup}>
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <nav className={tw.mainTabs}>
        <button className={cn(tw.mainTab, mainTab === 'info' && tw.mainTabActive)} onClick={() => handleMainTabChange('info')}>Ma'lumotlar</button>
        <button className={cn(tw.mainTab, mainTab === 'lessons' && tw.mainTabActive)} onClick={() => handleMainTabChange('lessons')}>Guruh darsliklari</button>
        <button className={cn(tw.mainTab, mainTab === 'attendance' && tw.mainTabActive)} onClick={() => handleMainTabChange('attendance')}>Akademik davomati</button>
      </nav>

      {mainTab === 'info' && (
        <section className={tw.infoLayout}>
          <article className={tw.panel}>
            <div className={tw.panelTitle}>Guruh mentorlari</div>
            <div className={tw.mentorList}>
              {Array.isArray(group.teachers) && group.teachers.length > 0 ? group.teachers.map(teacher => {
                const teacherName = teacher.name || teacher.full_name || "Noma'lum"
                return (
                  <div key={teacher.id || teacherName} className={tw.mentorCard}>
                    <div className={tw.avatar}>{getInitials(teacherName)}</div>
                    <div>
                      <div className={tw.role}>Teacher</div>
                      <strong>{teacherName}</strong>
                    </div>
                  </div>
                )
              }) : (
                <div className={tw.empty}>Mentorlar yo'q</div>
              )}
            </div>
          </article>

          <article className={tw.panel}>
            <div className={tw.panelTitle}>Parametrlar</div>
            <div className={tw.paramList}>
              <div><span>Kurs:</span><strong>{getCourseName(group)}</strong></div>
              <div><span>O'rtacha yosh:</span><strong>{group.avg_age || '-'}</strong></div>
              <div><span>O'quvchilar sig'imi:</span><strong>{group.student_limit || '-'}</strong></div>
              <div><span>Mavjud o'quvchilar:</span><strong>{students.length || group.students_count || 0}</strong></div>
              <div><span>Ochilgan sana:</span><strong>{getOpenedDate(group)}</strong></div>
              <div><span>Dars jadvali:</span><strong>{getScheduleSummary()}</strong></div>
            </div>
          </article>

          <article className={cn(tw.panel, tw.schedulePanel)}>
            <div className={tw.panelTitle}>Dars jadvali</div>
            <div className={tw.scheduleList}>
              {(schedules.length > 0 ? schedules : [{ id: 'fallback', teacher: 'Teacher', day: group.week_day || group.days, startTime: group.start_time || group.time, endTime: group.end_time, room: group.room_name || '-' }]).map(item => (
                <div key={item.id} className={tw.scheduleRow}>
                  <strong>{item.teacher}</strong>
                  <span>{formatScheduleDay(item.day)}</span>
                  <span>{item.startTime || '-'} dan {item.endTime || '-'} gacha</span>
                  <span>{[item.startDate && formatDate(item.startDate), item.endDate && formatDate(item.endDate)].filter(Boolean).join(' - ') || '-'}</span>
                  <span>{item.room}</span>
                </div>
              ))}
            </div>
            <div className={tw.monthStrip}>
              {lessonDays.map((day, index) => (
                <button key={`${day.value}-${index}`} className={cn(tw.monthBtn, index === selectedMonth ? tw.monthBtnActive : day.completed && tw.monthBtnMuted)} onClick={() => handleLessonDaySelect(day, index, true)}>
                  <span>{day.month}</span>
                  <strong>{day.day}</strong>
                </button>
              ))}
            </div>
          </article>
        </section>
      )}

      {mainTab === 'lessons' && (
        <section className={tw.lessonsLayout}>
          <div className={tw.sectionHead}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Guruh darsliklari</h2>
            <div className={tw.subTabs}>
              {lessonTabs.map(tab => (
                <button key={tab.id} className={cn(tw.subTab, lessonTab === tab.id && tw.subTabActive)} onClick={() => handleLessonTabChange(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {lessonTab === 'videos' && canManageHomework && (
              <button className={tw.primaryBtn} onClick={openVideoModal}>
                <Upload size={18} />
                Fayl yuklash
              </button>
            )}
            {lessonTab === 'homework' && canManageHomework && (
              <button className={tw.primaryBtn} onClick={openHomeworkInNewWindow}>
                <Plus size={18} />
                Yangi uy vazifa (yangi oynada)
              </button>
            )}
            {lessonTab === 'exams' && <button className={tw.primaryBtn}>Yangi imtihon</button>}
          </div>

          {lessonTab === 'homework' && (
            <div className={tw.homeworkGrid}>
              <div className={tw.panelPad}>
                <div className={tw.breadcrumb}>{getGroupName()} <span>/</span> Uyga vazifa</div>
                <div className={tw.controlRow}>
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
                  <button className={tw.outlineBtn} onClick={() => loadHomeworkResults()}>
                    <Eye size={18} />
                    Natijalar
                  </button>
                </div>

                <div className={tw.summary}>
                  <div><span>Topshirgan</span><strong>{submittedCount}</strong></div>
                  <div><span>Topshirmagan</span><strong>{notSubmittedRows.length}</strong></div>
                  <div><span>Kutmoqda</span><strong>{pendingCount}</strong></div>
                </div>

                {loadingHomework ? (
                  <div className={tw.empty}>Uy vazifalar yuklanmoqda...</div>
                ) : homeworks.length > 0 ? (
                  <div className={tw.taskList}>
                    {homeworks.map(item => (
                      <article key={item.id || item.title} className={tw.taskCard}>
                        <div className={tw.taskHead}>
                          <h3>{item.title}</h3>
                          <span className={tw.statusNeutral}>Lesson #{item.lessonId || '-'}</span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description || "Tavsif yo'q"}</p>
                        <div className={tw.taskMeta}>
                          <span>Muddat: {formatDate(item.deadline)}</span>
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className={tw.linkCell}>
                              <Download size={18} />
                              Yuklab olish
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={tw.empty}>Bu guruh uchun uy vazifa topilmadi.</div>
                )}

                {ownHomework && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                    <strong>Talaba uchun lesson bo'yicha vazifa</strong>
                    <span className="ml-2 font-semibold">{ownHomework.title || ownHomework.name || 'Uyga vazifa'}</span>
                    {(ownHomework.fileUrl || ownHomework.file_url || ownHomework.url) && (
                      <a className={tw.linkCell} href={ownHomework.fileUrl || ownHomework.file_url || ownHomework.url} target="_blank" rel="noreferrer">
                        Yuklab olish
                      </a>
                    )}
                  </div>
                )}
              </div>

              {canManageHomework && (
                <form className={cn(tw.panelPad, 'flex flex-col gap-4')} onSubmit={handleHomeworkSubmit}>
                  <div className={tw.panelTitlePlain}><Plus size={18} /> Yangi uy vazifa</div>
                  <label className={tw.field}>
                    <span><b>*</b> Nomi</span>
                    <input value={homeworkForm.title} onChange={e => setHomeworkForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Masalan: React props mashqi" required />
                  </label>
                  <label className={tw.field}>
                    <span>Dars</span>
                    <select value={homeworkForm.lessonId} onChange={e => setHomeworkForm(prev => ({ ...prev, lessonId: e.target.value }))}>
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic}</option>
                      ))}
                    </select>
                  </label>
                  <label className={tw.field}>
                    <span>Muddat</span>
                    <input type="date" value={homeworkForm.deadline} onChange={e => setHomeworkForm(prev => ({ ...prev, deadline: e.target.value }))} />
                  </label>
                  <label className={tw.field}>
                    <span>Tavsif</span>
                    <textarea value={homeworkForm.description} onChange={e => setHomeworkForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Vazifa matni..." />
                  </label>
                  <button className={tw.primaryBtn} type="submit" disabled={savingHomework || !homeworkForm.title.trim()}>
                    {savingHomework ? 'Saqlanmoqda...' : "Qo'shish"}
                  </button>
                </form>
              )}

              <div className={cn(tw.tableCard, 'xl:col-span-2')}>
                <table className={tw.table}>
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
                        <td><span className={normalizeResultStatus(row.status) === 'NOT_SUBMITTED' || normalizeResultStatus(row.status) === 'REJECTED' ? tw.statusNeutral : tw.statusSoft}>{getHomeworkStatusLabel(row.status)}</span></td>
                        <td>{row.grade}</td>
                        <td>{formatDate(row.submittedAt)}</td>
                        <td>
                          <button className={tw.linkCell} onClick={() => {
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
                <form className="grid gap-5 xl:col-span-2" onSubmit={handleHomeworkCheck}>
                  <div className={tw.breadcrumb}>
                    <button className={tw.linkCell} type="button" onClick={() => setSelectedResult(null)}>Kutayotganlar</button>
                    <span>/</span>
                    <strong>Uyga vazifa</strong>
                  </div>

                  <section className={tw.panelPad}>
                    <h2 className={tw.panelTitlePlain}>Uy vazifasi</h2>
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                      <span className="text-sm font-black text-slate-500">Izoh:</span>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{selectedHomework?.description || "Izoh yo'q"}</p>
                    </div>
                  </section>

                  <section className={tw.panelPad}>
                    <h2 className={tw.panelTitlePlain}>{selectedResult.studentName || "O'quvchi"}</h2>
                    <div className={tw.summary}>
                      <div><span>Vaqti:</span><strong>{formatDate(selectedResult.submittedAt)}</strong></div>
                      <div><span>Fayllar soni:</span><strong>{selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong></div>
                      <div><span>Status:</span><strong>{getHomeworkStatusLabel(selectedResult.status)}</strong></div>
                    </div>
                    <div className="grid gap-3">
                      <strong className="text-sm font-black">Fayl: {selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong>
                      <div className="flex flex-wrap gap-3">
                        {(selectedResultFiles.length > 0 ? selectedResultFiles : [selectedResult.fileUrl].filter(Boolean)).map((file, index) => (
                          <a key={`${file}-${index}`} href={file} target="_blank" rel="noreferrer" className={cn(tw.outlineBtn, 'min-w-28')}>
                            <Download size={18} />
                            Fayl {index + 1}
                          </a>
                        ))}
                      </div>
                      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                        <span className="text-sm font-black text-slate-500">Uyga vazifa izohi:</span>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{selectedResult.homeworkComment || selectedResult.comment || "Izoh yo'q"}</p>
                      </div>
                    </div>
                  </section>

                  <section className={cn(tw.panelPad, 'grid gap-4')}>
                    <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                      <Info size={24} />
                      <span>60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.</span>
                    </div>
                    <label className={tw.field}>
                      <span>Ball</span>
                      <div className="grid grid-cols-[1fr_96px] gap-3">
                        <input type="range" min="0" max="100" value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} />
                        <input type="number" min="0" max="100" value={checkForm.grade} onChange={e => handleGradeChange(e.target.value)} placeholder="60" />
                      </div>
                      <small>O'tish bali</small>
                    </label>
                    <label className={tw.field}>
                      <span>Status</span>
                      <select value={checkForm.status} onChange={e => setCheckForm(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="ACCEPTED">Qabul qilingan</option>
                        <option value="REJECTED">Qaytarilgan</option>
                        <option value="PENDING">Kutmoqda</option>
                      </select>
                    </label>
                    <label className={tw.field}>
                      <span>Izoh</span>
                      <textarea value={checkForm.comment} onChange={e => setCheckForm(prev => ({ ...prev, comment: e.target.value }))} placeholder="Izohingiz" />
                    </label>
                    <div className="flex flex-wrap justify-end gap-3">
                      <button type="button" className={tw.outlineBtn} onClick={() => setSelectedResult(null)}>Bekor qilish</button>
                      <button className={tw.primaryBtn} type="submit" disabled={checkingHomework || !selectedHomeworkId || !checkForm.studentId}>
                        {checkingHomework ? 'Yuborilmoqda...' : 'Yuborish'}
                      </button>
                    </div>
                  </section>
                </form>
              )}
            </div>
          )}

          {lessonTab === 'videos' && (
            <div className={tw.tableCard}>
              <table className={tw.table}>
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
                          <div className="flex flex-wrap items-center gap-3">
                            {isVideoFile(row) && (
                              <button className={tw.linkCell} type="button" onClick={() => setPreviewVideo(row)}>
                                <PlayCircle size={18} />
                                Ko'rish
                              </button>
                            )}
                            <a className={tw.linkCell} href={row.url} target="_blank" rel="noreferrer">
                              <Download size={18} />
                              {row.name || 'Fayl'}
                            </a>
                          </div>
                        ) : (
                          <span className={tw.linkCell}><PlayCircle size={18} /> {row.name || row.topic || 'Fayl'}</span>
                        )}
                      </td>
                      <td>{row.lessonName || row.topic || '-'}</td>
                      <td><span className={tw.statusNeutral}>{row.type || '-'}</span></td>
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
            <div className={tw.tableCard}>
              <table className={tw.table}>
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
                      <td><button className={tw.linkCell}>{row.topic || 'Examination'}</button></td>
                      <td>{row.attendanceCount || students.length || 0}</td>
                      <td>0</td>
                      <td><span className={row.status === 'Faol' ? tw.statusSoft : tw.statusNeutral}>{row.status || 'Tugagan'}</span></td>
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
            <div className="grid gap-5">
              <div className={tw.monthStrip}>
                {lessonDays.map((day, index) => (
                  <button key={`${day.value}-${index}`} className={cn(tw.monthBtn, index === selectedMonth ? tw.monthBtnActive : day.completed && tw.monthBtnMuted)} onClick={() => handleLessonDaySelect(day, index)}>
                    <span>{day.month}</span>
                    <strong>{day.day}</strong>
                  </button>
                ))}
              </div>

              <form className={cn(tw.panelPad, 'grid gap-4')} onSubmit={handleLessonSubmit}>
                <div className={tw.panelTitlePlain}>Yo'qlama va mavzu kiritish</div>
                <label className={tw.field}>
                  <span><b>*</b> Sana</span>
                  <input type="date" value={lessonForm.date} onChange={e => setLessonForm(prev => ({ ...prev, date: e.target.value }))} required />
                </label>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="lesson-source"
                      checked={lessonSource === 'plan'}
                      onChange={() => setLessonSource('plan')}
                    />
                    O'quv reja bo'yicha
                  </label>
                  <label className="inline-flex items-center gap-2">
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
                  <label className={tw.field}>
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
                  <label className={tw.field}>
                    <span><b>*</b> Mavzu</span>
                    <input value={lessonForm.topic} onChange={e => setLessonForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Mavzuni kiriting..." required />
                  </label>
                )}

                <label className={tw.field}>
                  <span>Tavsif (ixtiyoriy)</span>
                  <textarea value={lessonForm.description} onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Dars haqida qo'shimcha ma'lumot..." />
                </label>

                <div className={cn('rounded-lg border p-3 text-sm font-bold', attendanceWindow.open ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200')}>
                  {attendanceWindow.message}
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-[56px_1fr_260px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 dark:bg-slate-950">
                    <span>#</span>
                    <span>O'quvchi ismi</span>
                    <span>Davomat</span>
                  </div>
                  {students.length > 0 ? students.map((student, index) => (
                    <div key={student.id || student.name} className="grid grid-cols-[56px_1fr_260px] items-center gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                      <span>{index + 1}</span>
                      <span className="inline-flex items-center gap-2 font-bold"><span className={cn(tw.avatar, 'h-8 w-8 text-xs')}>{student.initials}</span>{student.name}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={cn('min-h-9 rounded-lg border px-3 text-sm font-black disabled:opacity-50', lessonForm.attendance[student.id] === true ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300')}
                          onClick={() => toggleAttendance(student.id, true)}
                        >
                          Keldi
                        </button>
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={cn('min-h-9 rounded-lg border px-3 text-sm font-black disabled:opacity-50', lessonForm.attendance[student.id] === false ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300')}
                          onClick={() => toggleAttendance(student.id, false)}
                        >
                          Kelmadi
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className={tw.empty}>Bu guruhda o'quvchilar topilmadi.</div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" className={tw.outlineBtn} onClick={() => {
                    setLessonForm(prev => ({ ...prev, topic: '', description: '', attendance: {} }))
                    setSelectedPlanId('')
                  }}>Bekor qilish</button>
                  <button type="submit" className={tw.purpleBtn} disabled={savingLesson || !canEditAttendance}>
                    {savingLesson ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {mainTab === 'attendance' && (
        <section className="grid gap-5">
          <div className={tw.summary}>
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
            <div key={month} className={tw.panelPad}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                {month}-o'quv oyi {monthIndex === 0 && <span className={tw.statusSoft}>Joriy oy</span>}
              </h2>
              <div className={cn(tw.monthStrip, '!m-0')}>
                {lessonDays.map((day, index) => (
                  <button key={`${month}-${day.value}-${index}`} className={cn(tw.monthBtn, monthIndex === 0 && index < 7 && tw.monthBtnMuted)}>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setPreviewVideo(null)}>
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-950 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white">
              <h2 className="truncate text-base font-bold">{previewVideo.name || 'Video'}</h2>
              <button className={cn(tw.iconBtn, '!border-slate-700 !bg-slate-800 !text-white hover:!bg-slate-700')} onClick={() => setPreviewVideo(null)} aria-label="Yopish">
                <X size={22} />
              </button>
            </div>
            <div className="bg-black">
              <video className="max-h-[72vh] w-full" src={previewVideo.url} controls autoPlay />
            </div>
          </div>
        </div>
      )}

      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={closeVideoModal}>
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Fayl yuklash</h2>
              <button className={tw.iconBtn} onClick={closeVideoModal} aria-label="Yopish">
                <X size={22} />
              </button>
            </div>

            <form className="grid gap-5 p-6" onSubmit={handleVideoUpload}>
              <label
                className="grid cursor-pointer place-items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-emerald-500/10"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  handleVideoFile(e.dataTransfer.files?.[0])
                }}
              >
                <input
                  className="hidden"
                  type="file"
                  accept="*/*"
                  onChange={e => handleVideoFile(e.target.files?.[0])}
                />
                <span className="grid h-16 w-16 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Upload size={38} />
                </span>
                <strong className="max-w-xl text-sm font-black text-slate-900 dark:text-white">Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</strong>
                <small className="text-sm font-semibold text-slate-500">Darslik, rasm, video yoki qo'shimcha material fayllarini yuklash mumkin</small>
              </label>

              {videoFile && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="grid min-w-[680px] grid-cols-[1.3fr_1fr_1fr_80px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 dark:bg-slate-950">
                    <span>File name</span>
                    <span><b>*</b> Dars</span>
                    <span><b>*</b> Fayl nomi</span>
                    <span>Actions</span>
                  </div>
                  <div className="grid min-w-[680px] grid-cols-[1.3fr_1fr_1fr_80px] items-center gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    <span className="truncate text-sm font-bold">{videoFile.name}</span>
                    <select className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950" value={videoLessonId} onChange={e => setVideoLessonId(e.target.value)} required>
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic || `Dars ${index + 1}`}</option>
                      ))}
                    </select>
                    <input className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950" value={videoName} onChange={e => setVideoName(e.target.value)} required />
                    <button
                      className={tw.dangerIcon}
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

              <div className="flex flex-wrap justify-end gap-3">
                <button className={tw.outlineBtn} type="button" onClick={closeVideoModal}>Bekor qilish</button>
                {videoFile && (
                  <button className={tw.primaryBtn} type="submit" disabled={uploadingFile || !videoLessonId || !videoName.trim()}>
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
