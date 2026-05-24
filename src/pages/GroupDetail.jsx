import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, postJson } from '../api'
import {
  ArrowLeft,
  BarChart3,
  MoreVertical,
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
// Backend API kerak: guruh bo'yicha o'quv reja mavzulari ro'yxati.
// Masalan: GET /api/v1/lesson-plans/group/{groupId}
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
  const [lessons, setLessons] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingLesson, setSavingLesson] = useState(false)
  const [mainTab, setMainTab] = useState('info')
  const [lessonTab, setLessonTab] = useState('exams')
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [lessonSource, setLessonSource] = useState('custom')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [lessonPlans] = useState([])
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [videoLessonId, setVideoLessonId] = useState('')
  const [videoName, setVideoName] = useState('')
  const [lessonHistoryDate, setLessonHistoryDate] = useState(new Date().toISOString().slice(0, 10))
  const [lessonForm, setLessonForm] = useState({
    date: new Date().toISOString().slice(0, 10),
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
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.rows)) return data.rows
    return []
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
    const base = allLessons.length > 0
      ? allLessons.map(lesson => lesson.date).filter(Boolean)
      : ['2026-05-02', '2026-05-05', '2026-05-07', '2026-05-09', '2026-05-12', '2026-05-14', '2026-05-16', '2026-05-19', '2026-05-21', '2026-05-23', '2026-05-26', '2026-05-28', '2026-05-30']

    return base.slice(0, 13).map(value => {
      const date = new Date(value)
      return {
        value,
        month: !isNaN(date) ? date.toLocaleDateString('en-US', { month: 'short' }) : 'May',
        day: !isNaN(date) ? date.getDate() : value,
        completed: allLessons.some(lesson => lesson.date?.slice(0, 10) === String(value).slice(0, 10))
      }
    })
  }

  const fetchGroupLessons = async () => {
    try {
      const response = await getJson(LESSONS_API)
      return filterGroupLessons(normalizeLessons(response))
    } catch (err) {
      const response = await getJson(`${LESSONS_BY_GROUP_API}/${groupId}`)
      return normalizeLessons(response)
    }
  }

  const loadAttendance = async () => {
    try {
      const response = await getJson(ATTENDANCE_ALL_API)
      const normalized = filterGroupAttendance(normalizeAttendance(response))
      setAttendanceRecords(normalized)
      return normalized
    } catch (err) {
      console.error('Attendance load error', err)
      setAttendanceRecords([])
      return []
    }
  }

  const loadLessons = async (date = lessonHistoryDate) => {
    try {
      const normalized = await fetchGroupLessons()
      setAllLessons(normalized)
      setLessons(date ? normalized.filter(lesson => lesson.date?.slice(0, 10) === date) : normalized)
    } catch (err) {
      console.error('Group lessons load error', err)
      setAllLessons([])
      setLessons([])
    }
  }

  const toggleAttendance = (studentId, isPresent) => {
    const canEditAttendance = lessonSource === 'plan' ? Boolean(selectedPlanId) : Boolean(lessonForm.topic.trim())
    if (!canEditAttendance) return
    setLessonForm(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: isPresent
      }
    }))
  }

  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    const selectedPlan = lessonPlans.find(plan => String(plan.id) === String(selectedPlanId))
    const topic = lessonSource === 'plan' ? selectedPlan?.title || selectedPlan?.topic || '' : lessonForm.topic.trim()
    if (savingLesson || !topic) return

    setSavingLesson(true)
    try {
      await postJson(LESSONS_API, {
        group_id: Number(groupId) || groupId,
        topic,
        description: lessonForm.description
      })

      if (students.length > 0) {
        await Promise.all(students
          .filter(student => student.id)
          .map(student => postJson(ATTENDANCE_API, {
            group_id: Number(groupId) || groupId,
            student_id: Number(student.id) || student.id,
            isPresent: lessonForm.attendance[student.id] === true
          }))
        )
      }

      await loadLessons(lessonHistoryDate)
      await loadAttendance()
      setLessonForm({
        date: new Date().toISOString().slice(0, 10),
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
    setVideoLessonId('')
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

  const handleVideoUpload = (e) => {
    e.preventDefault()
    if (!videoFile || !videoLessonId || !videoName.trim()) return
    alert('Video yuklash API berilgandan keyin ulanadi.')
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

      try {
        const [groupRes, studentsRes, schedulesRes, lessonsRes, attendanceRes] = await Promise.allSettled([
          getJson(`${GROUPS_API}/${groupId}`),
          getJson(`${GROUP_STUDENTS_API}/${groupId}`),
          getJson(`${GROUPS_API}/${groupId}/schedules`),
          fetchGroupLessons(),
          getJson(ATTENDANCE_ALL_API),
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

        if (lessonsRes.status === 'fulfilled') {
          const normalized = lessonsRes.value
          setAllLessons(normalized)
          setLessons(normalized.filter(lesson => lesson.date?.slice(0, 10) === lessonHistoryDate))
        } else {
          setAllLessons([])
          setLessons([])
          console.error('Group lessons load error', lessonsRes.reason)
        }

        if (attendanceRes.status === 'fulfilled') {
          setAttendanceRecords(filterGroupAttendance(normalizeAttendance(attendanceRes.value)))
        } else {
          setAttendanceRecords([])
          console.error('Attendance load error', attendanceRes.reason)
        }
      } catch (err) {
        console.error('Group detail load error', err)
      }

      setLoading(false)
    }

    load()
  }, [groupId])

  if (loading) return <div className="students-card">Yuklanmoqda...</div>
  if (!group) return <div className="students-card">Guruh topilmadi</div>

  const lessonDays = buildLessonDays()
  const canEditAttendance = lessonSource === 'plan' ? Boolean(selectedPlanId) : Boolean(lessonForm.topic.trim())
  const attendancePresentCount = attendanceRecords.filter(record => record.isPresent).length
  const attendanceAbsentCount = attendanceRecords.length - attendancePresentCount
  const examRows = allLessons.length > 0 ? allLessons : [
    { id: 7, topic: 'Examination', date: '2026-05-22', attendanceCount: 12, status: 'Faol' },
    { id: 6, topic: 'Examination', date: '2026-04-24', attendanceCount: 12, status: 'Tugagan' },
    { id: 5, topic: 'Examination', date: '2026-03-26', attendanceCount: 14, status: 'Tugagan' }
  ]
  const videoRows = allLessons.length > 0 ? allLessons.slice(0, 4) : [
    { id: 1, topic: 'Nodejs', date: '2026-05-14' },
    { id: 2, topic: 'Html asoslari', date: '2026-05-12' },
    { id: 3, topic: 'Takrorlash', date: '2026-05-19' },
    { id: 4, topic: 'State and Props', date: '2026-05-21' }
  ]

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
        <button className={mainTab === 'info' ? 'active' : ''} onClick={() => setMainTab('info')}>Ma'lumotlar</button>
        <button className={mainTab === 'lessons' ? 'active' : ''} onClick={() => setMainTab('lessons')}>Guruh darsliklari</button>
        <button className={mainTab === 'attendance' ? 'active' : ''} onClick={() => setMainTab('attendance')}>Akademik davomati</button>
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
                <button key={`${day.value}-${index}`} className={index === selectedMonth ? 'active' : day.completed ? 'muted' : ''} onClick={() => setSelectedMonth(index)}>
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
                <button key={tab.id} className={lessonTab === tab.id ? 'active' : ''} onClick={() => setLessonTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {lessonTab === 'videos' && (
              <button className="erp-primary-btn" onClick={openVideoModal}>
                <Upload size={18} />
                Qo'shish
              </button>
            )}
            {lessonTab === 'exams' && <button className="erp-primary-btn">Yangi imtihon</button>}
          </div>

          {lessonTab === 'homework' && (
            <div className="erp-panel erp-homework-preview">
              <div className="erp-breadcrumb">Kutatoyganlar <span>/</span> Uyga vazifa</div>
              <div className="erp-task-card">
                <h3>Uyga vazifa</h3>
                <p>API berilgandan keyin bu yerda berilgan vazifalar, topshirilgan ishlar va tekshirish oynasi chiqadi.</p>
              </div>
            </div>
          )}

          {lessonTab === 'videos' && (
            <div className="erp-table-card">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Video nomi</th>
                    <th>Dars nomi</th>
                    <th>Status</th>
                    <th>Dars sanasi</th>
                    <th>Hajmi</th>
                    <th>Qo'shilgan vaqti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {videoRows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>
                      <td><button className="erp-link-cell"><PlayCircle size={18} /> Bitiruv.mp4</button></td>
                      <td>{row.topic}</td>
                      <td><span className="erp-status soft">Tayyor</span></td>
                      <td>{formatDate(row.date)}</td>
                      <td>3.53 MB</td>
                      <td>{formatDate(row.date)}</td>
                      <td><MoreVertical size={18} /></td>
                    </tr>
                  ))}
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
                  <button key={`${day.value}-${index}`} className={index === selectedMonth ? 'active' : day.completed ? 'muted' : ''} onClick={() => setSelectedMonth(index)}>
                    <span>{day.month}</span>
                    <strong>{day.day}</strong>
                  </button>
                ))}
              </div>

              <form className="erp-panel erp-attendance-form" onSubmit={handleLessonSubmit}>
                <div className="erp-panel-title">Yo'qlama va mavzu kiritish</div>
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

                <div className="erp-attendance-table">
                  <div className="erp-attendance-head">
                    <span>#</span>
                    <span>O'quvchi ismi</span>
                    <span>Keldi</span>
                  </div>
                  {students.length > 0 ? students.map((student, index) => (
                    <div key={student.id || student.name} className="erp-attendance-row">
                      <span>{index + 1}</span>
                      <span className="erp-student-cell"><span className="erp-mini-avatar">{student.initials}</span>{student.name}</span>
                      <button
                        type="button"
                        disabled={!canEditAttendance}
                        className={`erp-toggle ${lessonForm.attendance[student.id] === true ? 'on' : ''}`}
                        onClick={() => toggleAttendance(student.id, lessonForm.attendance[student.id] !== true)}
                        aria-label="Davomat"
                      />
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

      {isVideoModalOpen && (
        <div className="erp-modal-overlay" onClick={closeVideoModal}>
          <div className="erp-video-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-video-modal-head">
              <h2>Qo'shish</h2>
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
                  accept=".mp4,.webm,.mpeg,.avi,.mkv,.m4v,.ogm,.mov,video/*"
                  onChange={e => handleVideoFile(e.target.files?.[0])}
                />
                <span className="erp-upload-box">
                  <Upload size={38} />
                </span>
                <strong>Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</strong>
                <small>Videofayl: .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov formatlaridan birida bo'lishi kerak</small>
              </label>

              {videoFile && (
                <div className="erp-video-file-table">
                  <div className="erp-video-file-head">
                    <span>File name</span>
                    <span><b>*</b> Dars</span>
                    <span><b>*</b> Video nomi</span>
                    <span>Actions</span>
                  </div>
                  <div className="erp-video-file-row">
                    <span>{videoFile.name}</span>
                    <select value={videoLessonId} onChange={e => setVideoLessonId(e.target.value)} required>
                      <option value="">Darsni tanlang</option>
                      {videoRows.map((lesson, index) => (
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
                  <button type="submit" disabled={!videoLessonId || !videoName.trim()}>
                    Fayllarni yuklash
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
