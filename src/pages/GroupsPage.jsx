import { useState, useEffect } from 'react'
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
  Calendar as CalendarIcon,
  UserPlus,
  GraduationCap,
  MoreVertical,
  RefreshCw,
  ToggleRight,
  ToggleLeft
} from 'lucide-react'
import { getJson, postJson } from '../api'

function GroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('guruhlar') // 'guruhlar' or 'arxiv'
  const navigate = useNavigate()
  
  // Dynamic datasets for dropdowns and mapping
  const [courses, setCourses] = useState([])
  const [rooms, setRooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  
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
    duration: '6 oy',
    description: ''
  })

  // Modal states for adding students to a group
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [activeGroupId, setActiveGroupId] = useState(null)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({ 
      name: '', course: '', room: '', teacherId: '',
      days: { Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false, Juma: false, Shanba: false, Yakshanba: false }, 
      time: '09:00', startDate: '', duration: '6 oy', description: '' 
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

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [groupsRes, coursesRes, roomsRes, teachersRes, studentsRes] = await Promise.allSettled([
        getJson('/groups/all'),
        getJson('/courses'),
        getJson('/rooms'),
        getJson('/teachers'),
        getJson('/students')
      ])

      if (groupsRes.status === 'fulfilled') {
        const data = groupsRes.value.data || groupsRes.value
        if (Array.isArray(data)) {
          setGroups(data)
        }
      } else {
        // Fallback static groups matching the user request mockup
        setGroups([
          { id: 1, name: 'N26', course: 'Backend', teacher: 'Mohirbek', studentsCount: 1, status: 'FAOL', days: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'], time: '09:30', room: 'Autodesk', duration: '6 oy' },
          { id: 2, name: 'n105', course: 'Backend', teacher: 'Mohirbek', studentsCount: 4, status: 'FAOL', days: ['Seshanba', 'Payshanba', 'Shanba'], time: '16:00', room: 'Autodesk', duration: '6 oy' }
        ])
      }

      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data || coursesRes.value || [])
      }
      if (roomsRes.status === 'fulfilled') {
        setRooms(roomsRes.value.data || roomsRes.value || [])
      }
      if (teachersRes.status === 'fulfilled') {
        setTeachers(teachersRes.value.data || teachersRes.value || [])
      }
      if (studentsRes.status === 'fulfilled') {
        setStudents(studentsRes.value.data || studentsRes.value || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedDays = Object.keys(formData.days).filter(day => formData.days[day])
      const payload = {
        name: formData.name,
        course: formData.course,
        room: formData.room,
        description: formData.description,
        host_name: '',
        days: selectedDays,
        time: formData.time,
        start_date: formData.startDate,
        student_limit: 0,
        teachers: selectedTeacherIds,
        students: selectedStudentIds,
      }
      const created = await postJson('/groups', payload)
      const createdGroup = created?.data || created
      
      // Real-time local state update
      const newGroup = {
        ...createdGroup,
        id: createdGroup.id || Date.now(),
        name: formData.name,
        course: formData.course,
        room: formData.room,
        time: formData.time,
        days: selectedDays,
        duration: formData.duration,
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

  const formatDays = (daysArray) => {
    if (!daysArray || !Array.isArray(daysArray)) return '-'
    const mapping = {
      'Dushanba': 'Du',
      'Seshanba': 'Se',
      'Chorshanba': 'Chor',
      'Payshanba': 'Pay',
      'Juma': 'Ju',
      'Shanba': 'Shan',
      'Yakshanba': 'Ya'
    }
    return daysArray.map(d => mapping[d] || d).join(', ')
  }

  const getTeacherName = (group) => {
    if (group.teacher_name) return group.teacher_name
    if (group.teacher) return group.teacher
    if (group.teachers && group.teachers.length > 0) {
      const firstT = group.teachers[0]
      if (typeof firstT === 'object') {
        return firstT.full_name || firstT.name || '-'
      }
      const tObj = teachers.find(t => t.id === firstT)
      return tObj ? (tObj.full_name || tObj.name) : '-'
    }
    return '-'
  }

  const getCourseName = (group) => {
    if (group.course) return group.course
    if (group.course_name) return group.course_name
    return '-'
  }

  const getRoomName = (group) => {
    if (group.room) return group.room
    if (group.room_name) return group.room_name
    return '-'
  }

  // Filters based on active tab and search query
  const filteredGroups = groups.filter(g => {
    const matchesSearch = (g.name || g.group_name || '').toLowerCase().includes(search.toLowerCase())
    const isArchived = g.status === 'Arxiv'
    if (activeTab === 'arxiv') {
      return matchesSearch && isArchived
    } else {
      return matchesSearch && !isArchived
    }
  })

  // Calculation for top Stats
  const totalGroupsCount = groups.filter(g => g.status !== 'Arxiv').length
  const totalTeachersCount = teachers.length
  const totalStudentsCount = students.length

  return (
    <div className="students-page animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="students-header">
        <div className="header-left">
          <h1 className="page-title">Guruhlar</h1>
          
          {/* TABS SELECTOR */}
          <div className="group-tabs-container">
            <button 
              className={`group-tab-btn ${activeTab === 'guruhlar' ? 'active' : ''}`}
              onClick={() => setActiveTab('guruhlar')}
            >
              <Users size={16} />
              Guruhlar
            </button>
            <button 
              className={`group-tab-btn ${activeTab === 'arxiv' ? 'active' : ''}`}
              onClick={() => setActiveTab('arxiv')}
            >
              <Clock size={16} />
              Arxiv
            </button>
          </div>
        </div>
        
        <button className="add-student-btn" onClick={openModal}>
          <Plus size={20} />
          Guruh qo'shish
        </button>
      </div>

      {/* STAT CARDS SECTION */}
      <div className="group-stats-grid">
        {/* Card 1: Jami Guruhlar */}
        <div className="group-stat-card">
          <div className="group-stat-header">
            <div className="group-stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <button className="group-stat-more">⋮</button>
          </div>
          <p className="group-stat-label">Jami guruhlar</p>
          <h2 className="group-stat-value">{totalGroupsCount}</h2>
        </div>

        {/* Card 2: O'qituvchilar */}
        <div className="group-stat-card">
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
        <div className="group-stat-card">
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
      <div className="students-card">
        <div className="card-controls">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="action-buttons">
            <button className="control-btn" onClick={loadAllData} title="Yangilash">
              <RefreshCw size={18} />
              Yangilash
            </button>
            <button className="control-btn">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Guruh nomi</th>
                <th>Kurs</th>
                <th>Davomiyligi</th>
                <th>Dars vaqti</th>
                <th>Xona</th>
                <th>O'qituvchi</th>
                <th>Talabalar</th>
                <th className="actions-col" style={{ textAlign: 'right' }}>
                  <RefreshCw size={14} style={{ cursor: 'pointer' }} onClick={loadAllData} />
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
                    Guruhlar topilmadi.
                  </td>
                </tr>
              ) : filteredGroups.map(group => {
                const isFaol = group.status === 'FAOL' || group.status === 'Aktiv' || !group.status
                return (
                  <tr key={group.id}>
                    {/* Status Switch with label inside/beside */}
                    <td>
                      <div className="group-status-toggle-wrapper">
                        <button 
                          className={`group-status-switch ${isFaol ? 'faol' : 'arxiv'}`} 
                          onClick={() => toggleGroupStatus(group.id)} 
                          title={isFaol ? "Arxivlash" : 'Faollashtirish'}
                        >
                          <span className="switch-dot"></span>
                        </button>
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
                    
                    {/* Davomiyligi */}
                    <td>
                      <span className="duration-text">
                        {group.duration || '6 oy'}
                      </span>
                    </td>
                    
                    {/* Dars vaqti */}
                    <td>
                      <div className="time-col-cell">
                        <span className="time-text">{group.time || '09:00'}</span>
                        <span className="days-text">{formatDays(group.days)}</span>
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
                        {group.studentsCount || group.students_count || 0}
                      </span>
                    </td>
                    
                    {/* Amallar Üç-nokta menusi */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-icon-btn" title="Talaba qo'shish" onClick={() => openStudentModal(group.id)} style={{ color: '#7c3aed' }}>
                          <UserPlus size={16} />
                        </button>
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
        <div className="pagination">
          <button className="pagination-arrow">
            <ChevronLeft size={18} />
            Previous
          </button>
          <div className="page-numbers">
            <button className="page-num active">1</button>
          </div>
          <button className="pagination-arrow">
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* GURUH QO'SHISH SLIDE-OVER */}
      {isModalOpen && (
        <div className="group-side-overlay" onClick={closeModal}>
          <aside className="group-side-panel" onClick={e => e.stopPropagation()}>
            <div className="group-side-header">
              <div>
                <h2>Guruh qo'shish</h2>
                <p className="s-modal-subtitle">Yangi guruh yaratish uchun quyidagi ma'lumotlarni kiriting.</p>
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
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {courses.length === 0 && (
                      <>
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                      </>
                    )}
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
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    {rooms.length === 0 && (
                      <>
                        <option value="Autodesk">Autodesk</option>
                        <option value="Xona 1">Xona 1</option>
                        <option value="Xona 2">Xona 2</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="s-form-group">
                  <label className="s-form-label">Davomiyligi <span>*</span></label>
                  <input 
                    type="text" 
                    className="s-form-input" 
                    placeholder="Masalan: 6 oy" 
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: e.target.value})}
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
                          const t = teachers.find(item => item.id === id)
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
                          const s = students.find(item => item.id === id)
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
                  <button type="button" className="s-btn-cancel" onClick={closeModal}>Bekor qilish</button>
                  <button type="submit" className="s-btn-submit active">Saqlash</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* TALABA QO'SHISH MODAL (Guruhga) */}
      {isStudentModalOpen && (
        <div className="student-modal-overlay" onClick={closeStudentModal}>
          <div className="student-modal-content" onClick={e => e.stopPropagation()}>
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
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={closeStudentModal}>Bekor qilish</button>
                <button type="submit" className="s-btn-submit active" style={{ flex: 'none', padding: '0.75rem 2rem' }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TEACHER SELECT MODAL FOR GROUP CREATION */}
      {isTeacherSelectOpen && (
        <div className="student-modal-overlay" onClick={() => setIsTeacherSelectOpen(false)}>
          <div className="student-modal-content" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">O'qituvchi tanlash</h2>
                <p className="s-modal-subtitle">Bitta yoki bir nechta o'qituvchini tanlang</p>
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

              <div style={{ display: 'flex', flexDirection: 'column', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
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

              <div className="s-modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={() => setIsTeacherSelectOpen(false)}>Bekor qilish</button>
                <button 
                  type="button" 
                  className="s-btn-submit active" 
                  style={{ flex: 'none', padding: '0.75rem 2rem' }} 
                  onClick={() => {
                    setSelectedTeacherIds(tempTeacherIds)
                    setIsTeacherSelectOpen(false)
                  }}
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SELECT MODAL FOR GROUP CREATION */}
      {isStudentSelectOpen && (
        <div className="student-modal-overlay" onClick={() => setIsStudentSelectOpen(false)}>
          <div className="student-modal-content" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Talaba qo'shish</h2>
                <p className="s-modal-subtitle">Bitta yoki bir nechta talabani tanlang</p>
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

              <div style={{ display: 'flex', flexDirection: 'column', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
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

              <div className="s-modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={() => setIsStudentSelectOpen(false)}>Bekor qilish</button>
                <button 
                  type="button" 
                  className="s-btn-submit active" 
                  style={{ flex: 'none', padding: '0.75rem 2rem' }} 
                  onClick={() => {
                    setSelectedStudentIds(tempStudentIds)
                    setIsStudentSelectOpen(false)
                  }}
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupsPage
