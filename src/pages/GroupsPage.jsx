import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Filter, 
  Trash2, 
  Pencil,
  ChevronLeft, 
  ChevronRight,
  X,
  Users,
  Clock,
  UserPlus,
  GraduationCap,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
import { deleteJson, getJson, getUserRole, patchJson, postJson } from '../api'
import { createTranslator } from '../i18n'
import ConfirmModal from '../components/ConfirmModal'

const COURSES_API = 'https://najot-edu.softwareengineer.uz/api/v1/courses'
const GROUPS_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups'
const GROUPS_ARCHIVE_API = 'https://najot-edu.softwareengineer.uz/api/v1/groups/archive'
const STUDENT_MY_GROUPS_API = '/students/my/groups'
const getViewportRowsLimit = () => {
  return 5
}
const WEEK_DAY_MAP = {
  Dushanba: 'MONDAY',
  Seshanba: 'TUESDAY',
  Chorshanba: 'WEDNESDAY',
  Payshanba: 'THURSDAY',
  Juma: 'FRIDAY',
  Shanba: 'SATURDAY',
  Yakshanba: 'SUNDAY'
}
function GroupsPage({ language = 'uz' }) {
  const t = createTranslator(language)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('guruhlar') // 'guruhlar' or 'arxiv'
  const [page, setPage] = useState(1)
  const [pageLimit, setPageLimit] = useState(getViewportRowsLimit)
  const loadRequestRef = useRef(0)
  const navigate = useNavigate()
  const isStudentUser = ['student', 'talaba'].includes(getUserRole())
  
  // Dynamic datasets for dropdowns and mapping
  const [courses, setCourses] = useState([])
  const [rooms, setRooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [formDataLoaded, setFormDataLoaded] = useState(false)
  
  // Selection states for group creation
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [tempTeacherIds, setTempTeacherIds] = useState([])
  const [tempStudentIds, setTempStudentIds] = useState([])
  const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false)
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false)
  const [teacherSearchText, setTeacherSearchText] = useState('')
  const [studentSearchText, setStudentSearchText] = useState('')

  // Modal states for creating/editing a group
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    room: '',
    teacherId: '',
    days: {
      Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false,
      Juma: false, Shanba: false, Yakshanba: false
    },
    time: '09:00',
    startDate: '',
    maxStudent: '0',
    description: ''
  })

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ open: true, title, message, onConfirm })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null })
  }

  const handleConfirm = async () => {
    if (typeof confirmModal.onConfirm === 'function') {
      await confirmModal.onConfirm()
    }
    closeConfirmModal()
  }

  // Modal states for adding students to a group
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [activeGroupId, setActiveGroupId] = useState(null)

  const getEntityId = (value) => {
    if (!value) return ''
    if (typeof value === 'object') return value.id || value.course_id || value.room_id || value._id || ''
    return value
  }

  const getRelatedIds = (items, keys = []) => {
    if (!Array.isArray(items)) return []

    return items
      .map(item => {
        if (!item || typeof item !== 'object') return item
        for (const key of keys) {
          if (item[key] !== undefined && item[key] !== null) return item[key]
        }
        return item.id || item._id
      })
      .filter(id => id !== undefined && id !== null && id !== '')
  }

  const buildDaysState = (days = []) => {
    const selected = Array.isArray(days) ? days : []
    return Object.keys(WEEK_DAY_MAP).reduce((acc, day) => {
      acc[day] = selected.includes(day) || selected.includes(WEEK_DAY_MAP[day])
      return acc
    }, {})
  }

  const loadGroupFormData = async (force = false) => {
    if (formDataLoaded && !force) return

    const [coursesRes, roomsRes, teachersRes, studentsRes] = await Promise.allSettled([
      getJson(COURSES_API),
      getJson('/rooms'),
      getJson('/teachers'),
      getJson('/students'),
    ])

    if (coursesRes.status === 'fulfilled') setCourses(getApiItems(coursesRes.value))
    if (roomsRes.status === 'fulfilled') setRooms(getApiItems(roomsRes.value))
    if (teachersRes.status === 'fulfilled') setTeachers(getApiItems(teachersRes.value))
    if (studentsRes.status === 'fulfilled') setStudents(getApiItems(studentsRes.value))
    setFormDataLoaded(true)
  }

  const openModal = (group = null) => {
    setEditingGroup(group)

    if (group) {
      const teacherIds = getRelatedIds(
        group.teachers || group.Teachers || group.GroupTeacher?.map(item => item?.Teacher || item?.teacher || item),
        ['teacher_id', 'teacherId']
      )
      const studentIds = getRelatedIds(
        group.students || group.Students || group.StudentGroup?.map(item => item?.Student || item?.student || item),
        ['student_id', 'studentId']
      )

      setFormData({
        name: group.name || group.group_name || '',
        course: String(group.course_id || getEntityId(group.course) || getEntityId(group.Course) || ''),
        room: String(group.room_id || getEntityId(group.room) || getEntityId(group.Room) || ''),
        teacherId: '',
        days: buildDaysState(group.week_day || group.days),
        time: group.start_time || group.time || '09:00',
        startDate: group.start_date || group.startDate || '',
        maxStudent: String(group.max_student ?? group.student_limit ?? '0'),
        description: group.description || ''
      })
      setSelectedTeacherIds(teacherIds)
      setSelectedStudentIds(studentIds)
    } else {
      setFormData({ 
        name: '', course: '', room: '', teacherId: '',
        days: { Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false, Juma: false, Shanba: false, Yakshanba: false }, 
        time: '09:00', startDate: '', maxStudent: '0', description: ''
      })
      setSelectedTeacherIds([])
      setSelectedStudentIds([])
    }

    setIsModalOpen(true)
    loadGroupFormData()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
    setFormData({ 
      name: '', course: '', room: '', teacherId: '',
      days: { Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false, Juma: false, Shanba: false, Yakshanba: false }, 
      time: '09:00', startDate: '', maxStudent: '0', description: ''
    })
    setSelectedTeacherIds([])
    setSelectedStudentIds([])
  }

  const removeTeacher = (id) => {
    setSelectedTeacherIds(prev => prev.filter(tId => tId !== id))
  }

  const removeStudent = (id) => {
    setSelectedStudentIds(prev => prev.filter(sId => sId !== id))
  }

  const openStudentModal = async (groupId) => {
    setActiveGroupId(groupId)
    try {
      const response = await getJson('/students')
      const data = response.data || response
      if (Array.isArray(data)) {
        setAvailableStudents(data.map(student => ({
          id: student.id,
          name: student.full_name || student.name || student.phone || 'Noma\'lum'
        })))
      }
    } catch (err) {
      console.error('Students API Error:', err)
      setAvailableStudents([])
    }

    setIsStudentModalOpen(true)
  }

  const closeStudentModal = () => {
    setIsStudentModalOpen(false)
    setSelectedStudents([])
    setStudentSearch('')
    setActiveGroupId(null)
  }

  const getApiItems = (response) => {
    const data = response?.data || response
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.data?.data)) return data.data.data
    if (Array.isArray(data?.data?.groups)) return data.data.groups
    if (Array.isArray(data?.data?.items)) return data.data.items
    if (Array.isArray(data?.data?.results)) return data.data.results
    if (Array.isArray(data?.data?.rows)) return data.data.rows
    if (Array.isArray(data?.groups)) return data.groups
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.rows)) return data.rows
    if (Array.isArray(data?.list)) return data.list
    return []
  }

  const normalizeMyGroup = (item = {}) => {
    const group = item.group || item.Group || item

    return {
      ...group,
      id: group.id || item.group_id || item.groupId || item.id,
      studentsCount: getGroupStudentsCount(group),
      teachersCount: getGroupTeachersCount(group),
      status: group.status || group.activity || 'FAOL'
    }
  }

  const getGroupStudentsCount = (group = {}) => {
    if (Array.isArray(group.students)) return group.students.length
    if (Array.isArray(group.Students)) return group.Students.length
    if (Array.isArray(group.StudentGroup)) return group.StudentGroup.length
    if (Array.isArray(group.group_students)) return group.group_students.length

    const count = group.studentsCount ?? group.students_count ?? group.student_count ?? group.current_students
    const parsed = Number(count)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getGroupTeachersCount = (group = {}) => {
    if (Array.isArray(group.teachers)) return group.teachers.length
    if (Array.isArray(group.Teachers)) return group.Teachers.length
    if (Array.isArray(group.GroupTeacher)) return group.GroupTeacher.length
    if (Array.isArray(group.group_teachers)) return group.group_teachers.length
    if (Array.isArray(group.teacher_ids)) return group.teacher_ids.length
    if (group.teacher || group.teacher_id || group.teacher_name) return 1

    const count = group.teachersCount ?? group.teachers_count ?? group.teacher_count
    const parsed = Number(count)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getGroupTeacherIds = (group = {}) => {
    const teacherItems = [
      ...(Array.isArray(group.teachers) ? group.teachers : []),
      ...(Array.isArray(group.Teachers) ? group.Teachers : []),
      ...(Array.isArray(group.GroupTeacher) ? group.GroupTeacher.map(item => item?.Teacher || item?.teacher || item) : []),
      ...(Array.isArray(group.group_teachers) ? group.group_teachers : []),
      ...(Array.isArray(group.teacher_ids) ? group.teacher_ids : [])
    ]

    const ids = teacherItems
      .map(item => item?.id ?? item?.teacher_id ?? item?.teacherId ?? item)
      .filter(id => id !== undefined && id !== null && id !== '')

    if (ids.length > 0) return ids.map(String)
    const singleId = group.teacher_id ?? group.teacherId ?? group.teacher?.id
    return singleId ? [String(singleId)] : []
  }

  const loadAllData = async (tab = activeTab) => {
    const requestId = ++loadRequestRef.current
    setLoading(true)
    setGroups([])

    try {
      if (isStudentUser) {
        const groupsRes = await getJson(STUDENT_MY_GROUPS_API)
        if (requestId !== loadRequestRef.current) return

        setGroups(getApiItems(groupsRes).map(normalizeMyGroup))
        setCourses([])
        setRooms([])
        setTeachers([])
        setStudents([])
        return
      }

      const [groupsRes] = await Promise.allSettled([
        getJson(tab === 'arxiv' ? GROUPS_ARCHIVE_API : '/groups/all'),
      ])

      if (requestId !== loadRequestRef.current) return

      if (groupsRes.status === 'fulfilled') {
        const data = getApiItems(groupsRes.value)
        const enriched = data.map(group => ({
          ...group,
          studentsCount: getGroupStudentsCount(group),
          teachersCount: getGroupTeachersCount(group),
          status: tab === 'arxiv' ? 'Arxiv' : (group.status || group.activity || 'FAOL')
        }))
        setGroups(enriched)
      } else {
        setGroups([])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    queueMicrotask(() => loadAllData())
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const nextLimit = getViewportRowsLimit()
      setPageLimit(prev => {
        if (prev === nextLimit) return prev
        setPage(1)
        return nextLimit
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleTabChange = (tab) => {
    if (isStudentUser) return
    setActiveTab(tab)
    setSearch('')
    setPage(1)
    loadAllData(tab)
  }

  const handleGroupFilterSubmit = (e) => {
    e.preventDefault()
    loadAllData(activeTab)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedDays = Object.keys(formData.days).filter(day => formData.days[day])
      const weekDays = selectedDays.map(day => WEEK_DAY_MAP[day]).filter(Boolean)
      const payload = {
        name: formData.name,
        description: formData.description,
        course_id: Number(formData.course),
        teachers: selectedTeacherIds.map(Number),
        students: selectedStudentIds.map(Number),
        room_id: Number(formData.room),
        start_date: formData.startDate,
        week_day: weekDays,
        start_time: formData.time,
        max_student: Number(formData.maxStudent) || 0
      }
      const selectedCourse = courses.find(course => String(course.id) === String(formData.course))
      const selectedRoom = rooms.find(room => String(room.id) === String(formData.room))

      if (editingGroup) {
        const updated = await patchJson(`${GROUPS_API}/${editingGroup.id}`, payload)
        const updatedGroup = updated?.data || updated
        setGroups(prev => prev.map(group =>
          group.id === editingGroup.id
            ? {
                ...group,
                ...updatedGroup,
                name: formData.name,
                course: updatedGroup?.course || selectedCourse || selectedCourse?.name,
                course_id: Number(formData.course),
                room: updatedGroup?.room || selectedRoom || selectedRoom?.name,
                room_id: Number(formData.room),
                time: formData.time,
                start_time: formData.time,
                days: selectedDays,
                week_day: weekDays,
                max_student: Number(formData.maxStudent) || 0,
                teachers: selectedTeacherIds,
                students: selectedStudentIds,
                teachersCount: selectedTeacherIds.length,
                studentsCount: selectedStudentIds.length,
              }
            : group
        ))
        closeModal()
        return
      }

      const created = await postJson(GROUPS_API, payload)
      const createdGroup = created?.data || created
      
      // Real-time local state update
      const newGroup = {
        ...createdGroup,
        id: createdGroup?.id || Date.now(),
        name: formData.name,
        course: createdGroup?.course || selectedCourse || selectedCourse?.name,
        course_id: Number(formData.course),
        room: createdGroup?.room || selectedRoom || selectedRoom?.name,
        room_id: Number(formData.room),
        time: formData.time,
        start_time: formData.time,
        days: selectedDays,
        week_day: weekDays,
        max_student: Number(formData.maxStudent) || 0,
        teachers: selectedTeacherIds,
        students: selectedStudentIds,
        teachersCount: selectedTeacherIds.length,
        studentsCount: selectedStudentIds.length,
        status: 'FAOL'
      }
      setGroups(prev => [newGroup, ...prev])
      closeModal()
    } catch (err) {
      console.error('Group save error:', err)
      alert(err.message || 'Guruh saqlashda xatolik yuz berdi.')
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    if (!activeGroupId) {
      alert("Guruh tanlanmadi. Iltimos yana urinib ko'ring.")
      return
    }

    try {
      await Promise.all(selectedStudents.map(studentId =>
        postJson('/student-group', {
          group_id: activeGroupId,
          student_id: studentId
        })
      ))
      closeStudentModal()
      alert('Talabalar guruhga muvaffaqiyatli biriktirildi.')
      loadAllData()
    } catch (err) {
      console.error('Student group assignment error:', err)
      alert(err.message || 'Talabani guruhga biriktirishda xatolik yuz berdi.')
    }
  }

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: { ...prev.days, [day]: !prev.days[day] }
    }))
  }

  const toggleStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    )
  }

  const toggleGroupStatus = (id) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== id) return g
      const newStatus = (g.status === 'FAOL' || g.status === 'Aktiv' || !g.status) ? 'Arxiv' : 'FAOL'
      return { ...g, status: newStatus }
    }))
  }

  const performDeleteGroup = async (id) => {
    try {
      await deleteJson(`${GROUPS_API}/${id}`)
      setGroups(prev => prev.filter(group => group.id !== id))
    } catch (err) {
      console.error('Group delete error:', err)
      alert(err.message || "Guruhni o'chirishda xatolik yuz berdi.")
    }
  }

  const deleteGroup = (id) => {
    openConfirmModal({
      title: "Guruhni o'chirish",
      message: "Haqiqatan ham bu guruhni o'chirmoqchimisiz?",
      onConfirm: () => performDeleteGroup(id),
    })
  }

  const formatDays = (daysArray) => {
    if (!daysArray || !Array.isArray(daysArray)) return '-'
    const mapping = {
      'Dushanba': 'Du',
      'Seshanba': 'Se',
      'Chorshanba': 'Chor',
      'Payshanba': 'Pay',
      'Juma': 'Ju',
      'Shanba': 'Shan',
      'Yakshanba': 'Ya',
      'MONDAY': 'Du',
      'TUESDAY': 'Se',
      'WEDNESDAY': 'Chor',
      'THURSDAY': 'Pay',
      'FRIDAY': 'Ju',
      'SATURDAY': 'Shan',
      'SUNDAY': 'Ya'
    }
    return daysArray.map(d => mapping[d] || d).join(', ')
  }

  const getTeacherName = (group) => {
    if (group.teacher_name) return group.teacher_name
    if (group.teacher) {
      if (typeof group.teacher === 'object') {
        return group.teacher.full_name || group.teacher.name || '-'
      }
      return group.teacher
    }
    if (group.teachers && group.teachers.length > 0) {
      const firstT = group.teachers[0]
      if (firstT && typeof firstT === 'object') {
        return firstT.full_name || firstT.name || '-'
      }
      if (firstT) {
        const tObj = teachers.find(t => t.id === firstT)
        return tObj ? (tObj.full_name || tObj.name) : '-'
      }
    }
    return '-'
  }

  const getCourseName = (group) => {
    if (group.course) {
      if (typeof group.course === 'object') {
        return group.course.name || group.course.title || '-'
      }
      return group.course
    }
    if (group.course_name) {
      if (typeof group.course_name === 'object') {
        return group.course_name.name || group.course_name.title || '-'
      }
      return group.course_name
    }
    return '-'
  }

  const getRoomName = (group) => {
    if (group.room) {
      if (typeof group.room === 'object') {
        return group.room.name || group.room.title || '-'
      }
      return group.room
    }
    if (group.room_name) {
      if (typeof group.room_name === 'object') {
        return group.room_name.name || group.room_name.title || '-'
      }
      return group.room_name
    }
    return '-'
  }

  // Filters based on active tab and search query
  const filteredGroups = groups.filter(g => {
    const matchesSearch = (g.name || g.group_name || '').toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageLimit))
  const currentPage = Math.min(page, totalPages)
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageLimit, currentPage * pageLimit)
  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  // Calculation for top Stats
  const totalGroupsCount = groups.length
  const groupTeacherIds = groups.flatMap(group => getGroupTeacherIds(group))
  const totalTeachersCount = groupTeacherIds.length > 0
    ? new Set(groupTeacherIds).size
    : groups.reduce((sum, group) => sum + getGroupTeachersCount(group), 0)
  const totalStudentsCount = groups.reduce((sum, group) => sum + getGroupStudentsCount(group), 0)

  return (
    <div className="students-page animate-fade-in max-lg:!gap-4">
      
      {/* HEADER SECTION */}
      <div className="students-header max-lg:!flex max-lg:!flex-row max-lg:!items-start max-lg:!justify-between max-lg:!gap-4 max-md:!grid max-md:!grid-cols-1 max-md:!gap-3">
        <div className="header-left">
          <h1 className="page-title max-md:!text-3xl max-md:!leading-tight">{isStudentUser ? t('pages.myGroups') : t('pages.groups')}</h1>
          
          {/* TABS SELECTOR */}
          {!isStudentUser && (
          <div className="group-tabs-container">
            <button 
              className={`group-tab-btn ${activeTab === 'guruhlar' ? 'active' : ''}`}
              onClick={() => handleTabChange('guruhlar')}
            >
              <Users size={16} />
              {t('pages.groups')}
            </button>
            <button 
              className={`group-tab-btn ${activeTab === 'arxiv' ? 'active' : ''}`}
              onClick={() => handleTabChange('arxiv')}
            >
              <Clock size={16} />
              {t('actions.archive')}
            </button>
          </div>
          )}
        </div>
        
        {!isStudentUser && (
        <button className="add-student-btn max-lg:!w-auto max-lg:!min-w-fit max-lg:!rounded-xl max-md:!w-full max-md:!justify-center" onClick={() => openModal()}>
          <Plus size={20} />
          {t('actions.addGroup')}
        </button>
        )}
      </div>

      {/* STAT CARDS SECTION */}
      <div className="group-stats-grid max-lg:!grid-cols-3 max-lg:!gap-4 max-md:!grid-cols-1 max-md:!gap-3">
        {/* Card 1: Jami Guruhlar */}
        <div className="group-stat-card max-lg:!translate-y-0 max-lg:!rounded-2xl">
          <div className="group-stat-header">
            <div className="group-stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <button className="group-stat-more">⋮</button>
          </div>
          <p className="group-stat-label">{isStudentUser ? 'Mening guruhlarim' : 'Jami guruhlar'}</p>
          <h2 className="group-stat-value">{totalGroupsCount}</h2>
        </div>

        {/* Card 2: O'qituvchilar */}
        <div className="group-stat-card max-lg:!translate-y-0 max-lg:!rounded-2xl">
          <div className="group-stat-header">
            <div className="group-stat-icon-wrapper green">
              <Users size={20} />
            </div>
            <button className="group-stat-more">⋮</button>
          </div>
          <p className="group-stat-label">O'qituvchilar</p>
          <h2 className="group-stat-value">{totalTeachersCount}</h2>
        </div>

        {/* Card 3: O'quvchilar */}
        <div className="group-stat-card max-lg:!translate-y-0 max-lg:!rounded-2xl">
          <div className="group-stat-header">
            <div className="group-stat-icon-wrapper purple">
              <GraduationCap size={20} />
            </div>
            <button className="group-stat-more">⋮</button>
          </div>
          <div className="group-stat-students-footer">
            <div>
              <p className="group-stat-label">O'quvchilar</p>
              <h2 className="group-stat-value">{totalStudentsCount}</h2>
            </div>
            {/* Overlay Avatars like in design */}
            <div className="group-stat-avatars">
              <span className="avatar-circle o">O</span>
              <span className="avatar-circle m">M</span>
              <span className="avatar-circle s">S</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH CARD */}
      <div className="students-card max-md:!rounded-2xl max-sm:!p-3">
        <form className="card-controls max-lg:!flex max-lg:!flex-row max-md:!grid max-md:!grid-cols-1 max-md:!gap-3" onSubmit={handleGroupFilterSubmit}>
          <div className="search-container max-md:!max-w-none">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={t('actions.search')} 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="search-input"
            />
          </div>
          <div className="action-buttons max-lg:!flex max-lg:!flex-row max-md:!grid max-md:!grid-cols-2 max-sm:!grid-cols-1 max-md:!gap-2">
            <button type="submit" className="control-btn max-md:!justify-center" title="Yangilash">
              <RefreshCw size={18} />
              {t('actions.refresh')}
            </button>
            <button type="button" className="control-btn max-md:!justify-center">
              <Filter size={18} />
              {t('actions.filters')}
            </button>
          </div>
        </form>

        {/* TABLE SECTION */}
        <div className="table-wrapper max-md:!-mx-5 max-md:!overflow-x-auto max-md:!px-5">
          <table className="students-table max-md:!table max-md:!min-w-[920px] max-md:!w-full max-sm:!min-w-[820px]">
            <thead>
              <tr>
                <th>{t('group.status')}</th>
                <th>{t('group.groupName')}</th>
                <th>{t('group.course')}</th>
                <th>{t('group.maxStudent')}</th>
                <th>{t('group.lessonTime')}</th>
                <th>{t('group.room')}</th>
                <th>{t('group.teacher')}</th>
                <th>{t('group.students')}</th>
                <th className="actions-col" style={{ textAlign: 'right' }}>
                  <RefreshCw size={14} style={{ cursor: 'pointer' }} onClick={() => loadAllData()} />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((item) => (
                  <tr key={item} className="skeleton-row">
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '60px', borderRadius: '12px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '65px' }}></div></td>
                    <td className="skeleton-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="skeleton-box" style={{ width: '60px' }}></div>
                        <div className="skeleton-box" style={{ width: '120px' }}></div>
                      </div>
                    </td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '100px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '30px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '20px', marginLeft: 'auto' }}></div></td>
                  </tr>
                ))
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
                    {t('empty.groups')}
                  </td>
                </tr>
              ) : paginatedGroups.map(group => {
                const isFaol = group.status === 'FAOL' || group.status === 'Aktiv' || !group.status
                return (
                  <tr key={group.id}>
                    {/* Status Switch with label inside/beside */}
                    <td>
                      <div className="group-status-toggle-wrapper">
                        {!isStudentUser && (
                          <button 
                            className={`group-status-switch ${isFaol ? 'faol' : 'arxiv'}`} 
                            onClick={() => toggleGroupStatus(group.id)} 
                            title={isFaol ? "Arxivlash" : 'Faollashtirish'}
                          >
                            <span className="switch-dot"></span>
                          </button>
                        )}
                        <span className={`status-pill-badge ${isFaol ? 'faol' : 'arxiv'}`}>
                          {isFaol ? 'FAOL' : 'ARXIV'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Guruh nomi */}
                    <td>
                      <button
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="group-detail-link-btn"
                      >
                        {group.name || group.group_name || 'Nomsiz Guruh'}
                      </button>
                    </td>
                    
                    {/* Kurs */}
                    <td>
                      <span className="course-pill-badge">
                        {getCourseName(group)}
                      </span>
                    </td>
                    
                    {/* Max o'quvchi */}
                    <td>
                      <span className="duration-text">
                        {group.max_student ?? group.student_limit ?? '-'}
                      </span>
                    </td>
                    
                    {/* Dars vaqti */}
                    <td>
                      <div className="time-col-cell">
                        <span className="time-text">{group.start_time || group.time || '09:00'}</span>
                        <span className="days-text">{formatDays(group.week_day || group.days)}</span>
                      </div>
                    </td>
                    
                    {/* Xona */}
                    <td>
                      <span className="room-text">
                        {getRoomName(group)}
                      </span>
                    </td>
                    
                    {/* O'qituvchi */}
                    <td>
                      <span className="teacher-text">
                        {getTeacherName(group)}
                      </span>
                    </td>
                    
                    {/* Talabalar */}
                    <td>
                      <span className="students-count-bold">
                        {getGroupStudentsCount(group)}
                      </span>
                    </td>
                    
                    {/* Amallar Üç-nokta menusi */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                        {!isStudentUser && (
                          <>
                            <button className="action-icon-btn" title="Talaba qo'shish" onClick={() => openStudentModal(group.id)} style={{ color: '#7c3aed' }}>
                              <UserPlus size={16} />
                            </button>
                            <button className="action-icon-btn edit" title="Tahrirlash" onClick={() => openModal(group)}>
                              <Pencil size={16} />
                            </button>
                            <button className="action-icon-btn delete" title="O'chirish" onClick={() => deleteGroup(group.id)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button className="action-icon-btn" title="Batafsil" onClick={() => navigate(`/groups/${group.id}`)}>
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination max-lg:!static max-lg:!m-0 max-lg:!rounded-none max-lg:!bg-transparent max-lg:!p-0 max-lg:!shadow-none max-sm:!gap-2">
          <button className="pagination-arrow" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>
            <ChevronLeft size={18} />
            {t('actions.previous')}
          </button>
          <div className="page-numbers">
            <button className="page-num active">{currentPage} / {totalPages}</button>
          </div>
          <button className="pagination-arrow" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || loading}>
            {t('actions.next')}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* GURUH QO'SHISH SLIDE-OVER */}
      {isModalOpen && (
        <div className="group-side-overlay max-md:!items-stretch max-md:!justify-end max-md:!p-0" onClick={closeModal}>
          <aside className="group-side-panel max-md:!h-dvh max-md:!max-h-dvh max-md:!w-full max-md:!max-w-[460px] max-md:!rounded-none max-md:!p-5" onClick={e => e.stopPropagation()}>
            <div className="group-side-header">
              <div>
                <h2>{editingGroup ? 'Guruhni tahrirlash' : "Guruh qo'shish"}</h2>
                <p className="s-modal-subtitle">
                  {editingGroup ? "Guruh ma'lumotlarini yangilang." : "Yangi guruh yaratish uchun quyidagi ma'lumotlarni kiriting."}
                </p>
              </div>
              <button className="s-modal-close" onClick={closeModal} aria-label="close">
                <X size={20} />
              </button>
            </div>

            <div className="group-side-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="s-form-group">
                  <label className="s-form-label">Guruh nomi <span>*</span></label>
                  <input 
                    type="text" 
                    className="s-form-input" 
                    placeholder="Masalan: N26" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Kurs <span>*</span></label>
                  <select 
                    className="s-form-input"
                    value={formData.course}
                    onChange={e => setFormData({...formData, course: e.target.value})}
                    required
                  >
                    <option value="" disabled>Kursni tanlang</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Xona <span>*</span></label>
                  <select 
                    className="s-form-input"
                    value={formData.room}
                    onChange={e => setFormData({...formData, room: e.target.value})}
                    required
                  >
                    <option value="" disabled>Xonani tanlang</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name || r.title}</option>
                    ))}
                  </select>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Maksimal o'quvchi <span>*</span></label>
                  <input 
                    type="number"
                    min="0"
                    className="s-form-input" 
                    placeholder="Masalan: 12"
                    value={formData.maxStudent}
                    onChange={e => setFormData({...formData, maxStudent: e.target.value})}
                    required
                  />
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Dars kunlari <span>*</span></label>
                  <div className="s-days-grid">
                    {Object.keys(formData.days).map(day => (
                      <label key={day} className="s-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={formData.days[day]}
                          onChange={() => toggleDay(day)}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Dars vaqti <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="time" 
                      className="s-form-input" 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Boshlanish sanasi <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="date" 
                      className="s-form-input" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Tavsif</label>
                  <textarea 
                    className="s-form-textarea" 
                    placeholder="Guruh haqida qo'shimcha ma'lumot (ixtiyoriy)" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">O'qituvchilar</label>
                  <div className="multi-select-card-container">
                    {selectedTeacherIds.length > 0 && (
                      <div className="selected-items-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {selectedTeacherIds.map(id => {
                          const t = teachers.find(item => String(item.id) === String(id))
                          return (
                            <span key={id} className="selected-item-tag">
                              {t ? (t.full_name || t.name) : `ID: ${id}`}
                              <button type="button" className="remove-tag-btn" onClick={() => removeTeacher(id)}>&times;</button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="add-item-trigger-btn"
                      onClick={() => {
                        setTempTeacherIds([...selectedTeacherIds])
                        setTeacherSearchText('')
                        setIsTeacherSelectOpen(true)
                      }}
                    >
                      <Plus size={16} />
                      Qo'shish
                    </button>
                  </div>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Talabalar</label>
                  <div className="multi-select-card-container">
                    {selectedStudentIds.length > 0 && (
                      <div className="selected-items-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {selectedStudentIds.map(id => {
                          const s = students.find(item => String(item.id) === String(id))
                          return (
                            <span key={id} className="selected-item-tag">
                              {s ? (s.full_name || s.name) : `ID: ${id}`}
                              <button type="button" className="remove-tag-btn" onClick={() => removeStudent(id)}>&times;</button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="add-item-trigger-btn"
                      onClick={() => {
                        setTempStudentIds([...selectedStudentIds])
                        setStudentSearchText('')
                        setIsStudentSelectOpen(true)
                      }}
                    >
                      <Plus size={16} />
                      Qo'shish
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="s-btn-cancel" onClick={closeModal}>{t('actions.cancel')}</button>
                  <button type="submit" className="s-btn-submit active">{t('actions.save')}</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* TALABA QO'SHISH MODAL (Guruhga) */}
      {isStudentModalOpen && (
        <div className="student-modal-overlay max-md:!items-stretch max-md:!justify-end max-md:!p-0" onClick={closeStudentModal}>
          <div className="student-modal-content max-md:!h-dvh max-md:!max-h-dvh max-md:!w-full max-md:!max-w-[460px] max-md:!rounded-none max-md:!p-5" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Talaba qo'shish</h2>
                <p className="s-modal-subtitle">Bitta yoki bir nechta talabani tanlang</p>
              </div>
              <button className="s-modal-close" onClick={closeStudentModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="s-form-group">
                <input 
                  type="text" 
                  className="s-form-input" 
                  placeholder="Talaba qidirish..." 
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                {availableStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map((student, index, arr) => (
                  <label key={student.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', 
                    padding: '1rem', cursor: 'pointer', 
                    borderBottom: index !== arr.length - 1 ? '1.5px solid #e2e8f0' : 'none',
                    transition: 'background 0.2s'
                  }} className="s-list-item-hover">
                    <input 
                      type="checkbox" 
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: '#7c3aed' }}
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{student.name}</span>
                  </label>
                ))}
              </div>

              <div className="s-modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem' }}>
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={closeStudentModal}>{t('actions.cancel')}</button>
                <button type="submit" className="s-btn-submit active" style={{ flex: 'none', padding: '0.75rem 2rem' }}>{t('actions.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TEACHER SELECT MODAL FOR GROUP CREATION */}
      {isTeacherSelectOpen && (
        <div className="student-modal-overlay group-picker-overlay" onClick={() => setIsTeacherSelectOpen(false)}>
          <div className="student-modal-content group-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">O'qituvchi tanlash</h2>
                <p className="s-modal-subtitle">Bitta yoki bir nechta o'qituvchini tanlang. Tanlangan: {tempTeacherIds.length}</p>
              </div>
              <button className="s-modal-close" onClick={() => setIsTeacherSelectOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="s-form-group">
                <input 
                  type="text" 
                  className="s-form-input" 
                  placeholder="O'qituvchi qidirish..." 
                  value={teacherSearchText}
                  onChange={e => setTeacherSearchText(e.target.value)}
                />
              </div>

              <div className="group-picker-list">
                {teachers.filter(t => (t.full_name || t.name || '').toLowerCase().includes(teacherSearchText.toLowerCase())).map((teacher, index, arr) => {
                  const isChecked = tempTeacherIds.includes(teacher.id)
                  return (
                    <label key={teacher.id} style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', 
                      padding: '1.0rem', cursor: 'pointer', 
                      borderBottom: index !== arr.length - 1 ? '1.5px solid #e2e8f0' : 'none',
                      transition: 'background 0.2s'
                    }} className="s-list-item-hover">
                      <input 
                        type="checkbox" 
                        style={{ width: '1.2rem', height: '1.2rem', accentColor: '#7c3aed' }}
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempTeacherIds(prev => prev.filter(tId => tId !== teacher.id))
                          } else {
                            setTempTeacherIds(prev => [...prev, teacher.id])
                          }
                        }}
                      />
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{teacher.full_name || teacher.name}</span>
                    </label>
                  )
                })}
              </div>

              <div className="s-modal-actions group-picker-actions">
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={() => setIsTeacherSelectOpen(false)}>{t('actions.cancel')}</button>
                <button 
                  type="button" 
                  className="s-btn-submit active" 
                  style={{ flex: 'none', padding: '0.75rem 2rem' }} 
                  onClick={() => {
                    setSelectedTeacherIds(tempTeacherIds)
                    setIsTeacherSelectOpen(false)
                  }}
                >
                  {t('actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SELECT MODAL FOR GROUP CREATION */}
      {isStudentSelectOpen && (
        <div className="student-modal-overlay group-picker-overlay" onClick={() => setIsStudentSelectOpen(false)}>
          <div className="student-modal-content group-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Talaba qo'shish</h2>
                <p className="s-modal-subtitle">Bitta yoki bir nechta talabani tanlang. Tanlangan: {tempStudentIds.length}</p>
              </div>
              <button className="s-modal-close" onClick={() => setIsStudentSelectOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="s-form-group">
                <input 
                  type="text" 
                  className="s-form-input" 
                  placeholder="Talaba qidirish..." 
                  value={studentSearchText}
                  onChange={e => setStudentSearchText(e.target.value)}
                />
              </div>

              <div className="group-picker-list">
                {students.filter(s => (s.full_name || s.name || '').toLowerCase().includes(studentSearchText.toLowerCase())).map((student, index, arr) => {
                  const isChecked = tempStudentIds.includes(student.id)
                  return (
                    <label key={student.id} style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', 
                      padding: '1.0rem', cursor: 'pointer', 
                      borderBottom: index !== arr.length - 1 ? '1.5px solid #e2e8f0' : 'none',
                      transition: 'background 0.2s'
                    }} className="s-list-item-hover">
                      <input 
                        type="checkbox" 
                        style={{ width: '1.2rem', height: '1.2rem', accentColor: '#7c3aed' }}
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempStudentIds(prev => prev.filter(sId => sId !== student.id))
                          } else {
                            setTempStudentIds(prev => [...prev, student.id])
                          }
                        }}
                      />
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{student.full_name || student.name}</span>
                    </label>
                  )
                })}
              </div>

              <div className="s-modal-actions group-picker-actions">
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={() => setIsStudentSelectOpen(false)}>{t('actions.cancel')}</button>
                <button 
                  type="button" 
                  className="s-btn-submit active" 
                  style={{ flex: 'none', padding: '0.75rem 2rem' }} 
                  onClick={() => {
                    setSelectedStudentIds(tempStudentIds)
                    setIsStudentSelectOpen(false)
                  }}
                >
                  {t('actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}

export default GroupsPage
