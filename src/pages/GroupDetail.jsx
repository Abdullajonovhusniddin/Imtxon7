import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteJson, getJson, postJson } from '../api'
import { GraduationCap, Trash2 } from 'lucide-react'

const GROUP_STUDENTS_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups/one/students'
const GROUP_ONE_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups/one'
const GROUPS_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups'
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

export default function GroupDetail({ groupId }) {
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingLesson, setSavingLesson] = useState(false)
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
    if (Array.isArray(data?.schedules)) return data.schedules
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
        day,
        startTime,
        endTime
      }
    })
  }

  const normalizeLessons = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || `${item.date || item.lesson_date}-${item.topic || item.title}`,
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

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isNaN(date)) return date.toLocaleDateString()
    return String(value)
  }

  const getCourseName = (groupData) => {
    const course = groupData?.course || groupData?.Course || groupData?.course_name || groupData?.direction || groupData?.subject
    if (!course) return '-'
    if (typeof course === 'object') {
      return course.name || course.title || course.course_name || '-'
    }
    return course
  }

  const getOpenedDate = (groupData) => {
    return formatDate(
      groupData?.opened_at ||
      groupData?.open_date ||
      groupData?.start_date ||
      groupData?.created_at ||
      groupData?.createdAt
    )
  }

  const formatScheduleDay = (value) => {
    if (!value) return '-'
    if (Array.isArray(value)) {
      return value.map(day => WEEK_DAY_LABELS[day] || day).join('-')
    }
    return WEEK_DAY_LABELS[value] || value
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
        const time = item.endTime
          ? `${item.startTime} - ${item.endTime}`
          : item.startTime
        return [day, time].filter(Boolean).join(' ')
      })
      .filter(label => label && label !== '-')

    return labels.length > 0 ? labels.join(', ') : '-'
  }

  const loadLessons = async (date = lessonHistoryDate) => {
    try {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      const response = await getJson(`${GROUPS_API}/${groupId}/lesson${params.toString() ? `?${params.toString()}` : ''}`)
      setLessons(normalizeLessons(response))
    } catch (err) {
      console.error('Group lessons load error', err)
      setLessons([])
    }
  }

  const toggleAttendance = (studentId, isPresent) => {
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
    if (savingLesson) return

    setSavingLesson(true)
    try {
      const attendance = students
        .map(student => {
          const studentId = student.id
          if (!studentId || lessonForm.attendance[studentId] === undefined) return null
          return {
            student_id: studentId,
            is_present: lessonForm.attendance[studentId]
          }
        })
        .filter(Boolean)

      await postJson(`${GROUPS_API}/${groupId}/lesson`, {
        date: lessonForm.date,
        topic: lessonForm.topic,
        title: lessonForm.topic,
        description: lessonForm.description,
        attendance
      })

      await loadLessons(lessonHistoryDate)
      setLessonForm({
        date: new Date().toISOString().slice(0, 10),
        topic: '',
        description: '',
        attendance: {}
      })
      alert('Dars jurnali saqlandi.')
    } catch (err) {
      console.error('Group lesson save error', err)
      alert(err.message || 'Dars jurnalini saqlashda xatolik yuz berdi.')
    } finally {
      setSavingLesson(false)
    }
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
        const [groupRes, studentsRes, schedulesRes, lessonsRes] = await Promise.allSettled([
          getJson(`${GROUPS_API}/${groupId}`),
          getJson(`${GROUP_STUDENTS_API}/${groupId}`),
          getJson(`${GROUPS_API}/${groupId}/schedules`),
          getJson(`${GROUPS_API}/${groupId}/lesson?date=${lessonHistoryDate}`),
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
          setLessons(normalizeLessons(lessonsRes.value))
        } else {
          setLessons([])
          console.error('Group lessons load error', lessonsRes.reason)
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

  return (
    <div className="group-detail-page">
      <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{group.name || group.group_name || 'Guruh'}</h1>
          <div style={{ marginTop: '8px', color: '#64748b' }}>{getCourseName(group)}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ padding: '6px 10px', background: '#ecfdf5', color: '#065f46', borderRadius: 8, fontWeight: 700 }}>{group.status || 'Aktiv'}</div>
          <button className="action-icon-btn delete" title="O'chirish" onClick={deleteGroup}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem', marginTop: '1rem' }}>
        <div className="students-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Guruh mentorlari</h3>
          {Array.isArray(group.teachers) && group.teachers.length > 0 ? (
            group.teachers.map((teacher) => {
              const teacherName = teacher.name || teacher.full_name || "Noma'lum"
              return (
                <div key={teacher.id || teacherName} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 999, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getInitials(teacherName)}
                  </div>
                  <div>
                    <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>Teacher</div>
                    <div style={{ fontWeight: 700 }}>{teacherName}</div>
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ padding: '1rem 0', color: '#64748b' }}>Mentorlar yo'q</div>
          )}
        </div>

        <div className="students-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Parametrlar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fan/Kurs:</span><strong>{getCourseName(group)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ochilgan sana:</span><strong>{getOpenedDate(group)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><span>Dars jadvali:</span><strong style={{ textAlign: 'right' }}>{getScheduleSummary()}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O'rtacha yosh:</span><strong>{group.avg_age || '-'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O'quvchilar sig'imi:</span><strong>{group.student_limit || '-'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mavjud o'quvchilar:</span><strong>{students.length || group.students_count || 0}</strong></div>
          </div>
        </div>
      </div>

      <div className="students-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={22} color="#7c3aed" />
            <h3 style={{ margin: 0 }}>Guruh o'quvchilari</h3>
          </div>
          <span className="group-tag">{students.length} ta</span>
        </div>

        <form onSubmit={handleLessonSubmit} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '0.75rem', alignItems: 'end', marginTop: '1rem' }}>
          <div className="s-form-group" style={{ margin: 0 }}>
            <label className="s-form-label">Dars sanasi</label>
            <input
              type="date"
              className="s-form-input"
              value={lessonForm.date}
              onChange={e => setLessonForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="s-form-group" style={{ margin: 0 }}>
            <label className="s-form-label">Dars mavzusi</label>
            <input
              type="text"
              className="s-form-input"
              placeholder="Bugungi mavzuni kiriting"
              value={lessonForm.topic}
              onChange={e => setLessonForm(prev => ({ ...prev, topic: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="s-btn-submit active" disabled={savingLesson} style={{ height: '44px', padding: '0 1.25rem' }}>
            {savingLesson ? 'Saqlanmoqda...' : 'Jurnal ochish'}
          </button>
          <div className="s-form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
            <textarea
              className="s-form-textarea"
              placeholder="Izoh (ixtiyoriy)"
              value={lessonForm.description}
              onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
              style={{ minHeight: '72px' }}
            />
          </div>
        </form>

        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Telefon</th>
                <th>Email</th>
                <th>Tug'ilgan sanasi</th>
                <th>Davomat</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map(student => (
                  <tr key={student.id || student.name}>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar" style={{ backgroundColor: '#f1f5f9' }}>
                          {student.initials}
                        </div>
                        <span className="student-name">{student.name}</span>
                      </div>
                    </td>
                    <td><span className="phone-text">{student.phone}</span></td>
                    <td><span className="email-text">{student.email}</span></td>
                    <td>{student.birthDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className={`control-btn ${lessonForm.attendance[student.id] === true ? 'active' : ''}`}
                          onClick={() => toggleAttendance(student.id, true)}
                        >
                          Keldi
                        </button>
                        <button
                          type="button"
                          className={`control-btn ${lessonForm.attendance[student.id] === false ? 'active' : ''}`}
                          onClick={() => toggleAttendance(student.id, false)}
                        >
                          Kelmadi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Bu guruhda o'quvchilar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="students-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Dars tarixi</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              loadLessons(lessonHistoryDate)
            }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}
          >
            <div className="s-form-group" style={{ margin: 0 }}>
              <label className="s-form-label">Sana</label>
              <input
                type="date"
                className="s-form-input"
                value={lessonHistoryDate}
                onChange={e => setLessonHistoryDate(e.target.value)}
              />
            </div>
            <button type="submit" className="control-btn" style={{ height: '44px' }}>
              Ko'rish
            </button>
          </form>
        </div>

        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Mavzu</th>
                <th>Izoh</th>
                <th>Davomat</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length > 0 ? (
                lessons.map(lesson => (
                  <tr key={lesson.id}>
                    <td>{formatDate(lesson.date)}</td>
                    <td>{lesson.topic}</td>
                    <td>{lesson.description || '-'}</td>
                    <td>{lesson.attendanceCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Bu sana bo'yicha dars tarixi topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
