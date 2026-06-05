import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  Filter,
  Upload,
  Calendar as CalendarIcon,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { deleteJson, getJson, patchJson, postJson } from '../api'
import { createTranslator } from '../i18n'
import ConfirmModal from '../components/ConfirmModal'

const TEACHERS_API = 'https://najot-edu.softwareengineer.uz/api/v1/teachers'
const TEACHERS_ARCHIVE_API = 'https://najot-edu.softwareengineer.uz/api/v1/teachers/archive'
const TEACHER_ONE_API = 'https://najot-edu.softwareengineer.uz/api/v1/teachers/one'
const getViewportRowsLimit = () => {
  return 5
}

function TeachersPage({ language = 'uz' }) {
  const t = createTranslator(language)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)
  const [pageLimit, setPageLimit] = useState(getViewportRowsLimit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [failedPhotoIds, setFailedPhotoIds] = useState([])
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)

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

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', address: '', groups: [], phone: '', birthDate: '', gender: '', password: '', coin: '0', status: 'Aktiv' })

  const resolveImageUrl = (src) => {
    if (!src) return null
    if (typeof src === 'string') return src
    if (typeof src === 'object') {
      return src.url || src.path || src.src || src.image || src.avatar || null
    }
    return null
  }

  const normalizeImageUrl = (url) => {
    if (!url) return null
    if (typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/')) return `${TEACHERS_API}${url}`
    return `${TEACHERS_API}/${url}`
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isNaN(date)) return date.toLocaleDateString()
    return String(value)
  }

  const getInitials = (name = '') => {
    const initials = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('')

    return initials || 'N'
  }

  const getGroupNames = (teacher) => {
    if (Array.isArray(teacher.GroupTeacher)) {
      return teacher.GroupTeacher
        .map(item => item?.Group?.name || item?.Group?.group_name)
        .filter(Boolean)
    }

    if (Array.isArray(teacher.groups)) {
      return teacher.groups
        .map(group => {
          if (typeof group === 'string') return group
          return group?.name || group?.group_name || group?.title
        })
        .filter(Boolean)
    }

    if (teacher.group_name || teacher.group) {
      return [teacher.group_name || teacher.group]
    }

    return []
  }

  const normalizePhone = (value = '') => {
    const phone = String(value).trim()
    if (!phone) return ''
    if (phone.startsWith('+998')) return phone
    if (phone.startsWith('998')) return `+${phone}`
    return `+998${phone.replace(/^\+/, '')}`
  }

  // Group select states
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const loadTeachers = async (tab = activeTab) => {
    setLoading(true)
    setFailedPhotoIds([])
    try {
      const response = await getJson(tab === 'archive' ? TEACHERS_ARCHIVE_API : TEACHERS_API)
      const data = response.data || response
      const teachersData = Array.isArray(data)
        ? data
        : Array.isArray(data?.teachers)
          ? data.teachers
          : Array.isArray(data?.data)
            ? data.data
            : []

      const mapped = teachersData.map(t => {
        const name = t.full_name || t.name || t.fullName || "Noma'lum"
        const rawPhoto = t.photo || t.image || t.avatar || t.photo_url || t.photoUrl || t.profile_photo || t.picture || t.image_url || t.avatar_url || t.photo?.url || t.image?.url || t.avatar?.url
        const photo = normalizeImageUrl(resolveImageUrl(rawPhoto))
        const groupNames = getGroupNames(t)
        const rawBirthDate = t.birth_date || t.birthDate || t.dob || t.birthday || t.born

        return ({
          ...t,
          name,
          photo,
          initials: getInitials(name),
          phone: t.phone || t.mobile || t.phone_number || '-',
          email: t.email || '-',
          birthDate: formatDate(rawBirthDate),
          groupList: groupNames,
          group: groupNames.join(', '),
          createdAt: formatDate(t.created_at || t.createdAt),
          coin: t.coin || t.balance || '0',
          status: tab === 'archive' ? 'Arxiv' : (t.status || t.activity || 'Aktiv'),
        })
      }).sort((a, b) => Number(a.id) - Number(b.id))
      setTeachers(mapped)
    } catch (err) {
      console.error('Teachers API Error:', err)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const groupsResponse = await getJson('/groups/all')
        const groupsData = groupsResponse.data || groupsResponse
        if (Array.isArray(groupsData)) setAvailableGroups(groupsData)
      } catch (err) {
        console.error('Group list API Error:', err)
      }

      loadTeachers('active')
    }

    loadData()
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
    setActiveTab(tab)
    setSearch('')
    setPage(1)
    loadTeachers(tab)
  }

  const filteredTeachers = teachers.filter((t) => {
    const fullName = String(t.name || t.full_name || '')
    return fullName.toLowerCase().includes(search.toLowerCase())
  })
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageLimit))
  const currentPage = Math.min(page, totalPages)
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * pageLimit, currentPage * pageLimit)
  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const handleAddGroup = (group) => {
    if (!formData.groups.find(g => g.id === group.id)) {
      setFormData({ ...formData, groups: [...formData.groups, group] })
    }
    setGroupSearch('')
    setShowGroupDropdown(false)
  }

  const handleRemoveGroup = (groupId) => {
    setFormData({ ...formData, groups: formData.groups.filter(g => g.id !== groupId) })
  }

  const getTeacherById = async (id) => {
    const response = await getJson(`${TEACHER_ONE_API}/${id}`)
    return response?.data || response
  }

  const fillTeacherForm = (teacher) => {
    const teacherGroups = Array.isArray(teacher.groups)
      ? teacher.groups
      : Array.isArray(teacher.GroupTeacher)
        ? teacher.GroupTeacher.map(item => item?.Group).filter(Boolean)
        : []

    setEditingTeacher(teacher)
    setFormData({
      name: teacher.full_name || teacher.name || '',
      email: teacher.email || '',
      address: teacher.address || '',
      groups: teacherGroups,
      phone: teacher.phone || '',
      birthDate: teacher.birth_date || teacher.birthDate || '',
      gender: teacher.gender || '',
      password: '',
      coin: teacher.coin || '0',
      status: teacher.status || 'Aktiv',
    })
  }

  const openModal = async (teacher = null) => {
    setPhotoFile(null)

    if (teacher) {
      fillTeacherForm(teacher)
      setIsModalOpen(true)

      try {
        const freshTeacher = await getTeacherById(teacher.id)
        fillTeacherForm({ ...teacher, ...freshTeacher })
      } catch (err) {
        console.error('Teacher detail API Error:', err)
        alert(err.message || "O'qituvchi ma'lumotlarini yuklashda xatolik yuz berdi.")
      }
    } else {
      setEditingTeacher(null)
      setFormData({ name: '', email: '', address: '', groups: [], phone: '', birthDate: '', gender: '', password: '', coin: '0', status: 'Aktiv' })
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTeacher(null)
    setPhotoFile(null)
  }

  const buildTeacherFormData = () => {
    const fd = new FormData()
    fd.append('full_name', formData.name)
    fd.append('email', formData.email)
    fd.append('phone', normalizePhone(formData.phone))
    fd.append('address', formData.address || '')
    fd.append('birth_date', formData.birthDate || '')
    if (formData.gender) fd.append('gender', formData.gender)
    if (formData.password) fd.append('password', formData.password)
    if (photoFile) fd.append('photo', photoFile)

    const groupIds = Array.isArray(formData.groups)
      ? formData.groups.map(g => g?.id || g?.group_id || g?.groupId || g).filter(Boolean)
      : []
    groupIds.forEach(id => fd.append('groups', id))

    return fd
  }

  const appendChangedField = (fd, key, currentValue, originalValue) => {
    const current = currentValue ?? ''
    const original = originalValue ?? ''
    if (String(current) !== String(original)) {
      fd.append(key, current)
    }
  }

  const buildTeacherPatchData = () => {
    const fd = new FormData()
    const originalGroupIds = Array.isArray(editingTeacher?.groups)
      ? editingTeacher.groups.map(g => g?.id || g?.group_id || g?.groupId || g).filter(Boolean).map(String)
      : Array.isArray(editingTeacher?.GroupTeacher)
        ? editingTeacher.GroupTeacher.map(item => item?.Group?.id || item?.group_id).filter(Boolean).map(String)
        : []
    const currentGroupIds = Array.isArray(formData.groups)
      ? formData.groups.map(g => g?.id || g?.group_id || g?.groupId || g).filter(Boolean).map(String)
      : []

    appendChangedField(fd, 'full_name', formData.name, editingTeacher?.full_name || editingTeacher?.name)
    appendChangedField(fd, 'email', formData.email, editingTeacher?.email)
    appendChangedField(fd, 'phone', normalizePhone(formData.phone), editingTeacher?.phone)
    appendChangedField(fd, 'address', formData.address, editingTeacher?.address)
    appendChangedField(fd, 'birth_date', formData.birthDate, editingTeacher?.birth_date || editingTeacher?.birthDate)
    appendChangedField(fd, 'gender', formData.gender, editingTeacher?.gender)
    if (formData.password) fd.append('password', formData.password)
    if (photoFile) fd.append('photo', photoFile)

    if (currentGroupIds.join(',') !== originalGroupIds.join(',')) {
      currentGroupIds.forEach(id => fd.append('groups', id))
    }

    return fd
  }

  const mapTeacherToRow = (teacher, fallback = {}) => {
    const name = teacher?.full_name || teacher?.name || fallback.name || "Noma'lum"
    const groupList = getGroupNames(teacher || {})

    return {
      ...fallback,
      ...teacher,
      id: teacher?.id || fallback.id || Date.now(),
      name,
      email: teacher?.email || fallback.email || '-',
      phone: teacher?.phone || fallback.phone || '-',
      birthDate: formatDate(teacher?.birth_date || teacher?.birthDate || fallback.birthDate),
      gender: teacher?.gender || fallback.gender || '',
      photo: teacher?.photo ? normalizeImageUrl(resolveImageUrl(teacher.photo)) : fallback.photo || null,
      initials: getInitials(name),
      groupList: groupList.length > 0 ? groupList : fallback.groupList || [],
      group: groupList.length > 0 ? groupList.join(', ') : fallback.group || '-',
      coin: teacher?.coin || fallback.coin || '0',
      status: teacher?.status || fallback.status || 'Aktiv',
      createdAt: formatDate(teacher?.created_at || teacher?.createdAt || fallback.createdAt),
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      if (editingTeacher) {
        const updated = await patchJson(`${TEACHERS_API}/${editingTeacher.id}`, buildTeacherPatchData())
        const updatedTeacher = updated?.data || updated
        const fallback = {
          ...editingTeacher,
          name: formData.name,
          email: formData.email,
          phone: normalizePhone(formData.phone),
          birthDate: formData.birthDate,
          gender: formData.gender,
          groupList: formData.groups.map(group => group.name || group.group_name).filter(Boolean),
        }

        setTeachers(prev => prev.map(t =>
          t.id === editingTeacher.id ? mapTeacherToRow(updatedTeacher, fallback) : t
        ))
        closeModal()
        return
      }

      const created = await postJson(TEACHERS_API, buildTeacherFormData())
      const createdTeacher = created?.data || created
      setTeachers(prev => [...prev, {
        ...createdTeacher,
        id: createdTeacher?.id || Date.now(),
        name: createdTeacher?.full_name || formData.name,
        email: createdTeacher?.email || formData.email,
        phone: createdTeacher?.phone || normalizePhone(formData.phone),
        birthDate: createdTeacher?.birth_date || formData.birthDate,
        gender: createdTeacher?.gender || formData.gender,
        password: formData.password,
        photo: createdTeacher?.photo ? normalizeImageUrl(resolveImageUrl(createdTeacher.photo)) : null,
        initials: getInitials(createdTeacher?.full_name || formData.name),
        group: formData.groups[0]?.name || formData.groups[0]?.group_name || '-',
        groupList: formData.groups.map(group => group.name || group.group_name).filter(Boolean),
        coin: '0',
        status: 'Aktiv',
      }])

      closeModal()
    } catch (err) {
      console.error('Teacher save error:', err)
      alert(err.message || "O'qituvchi saqlashda xatolik yuz berdi.")
    } finally {
      setSaving(false)
    }
  }

  const performDeleteTeacher = async (id) => {
    try {
      await deleteJson(`${TEACHERS_API}/${id}`)
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Teacher delete error:', err)
      alert(err.message || "O'qituvchini o'chirishda xatolik yuz berdi.")
    }
  }

  const deleteTeacher = (id) => {
    openConfirmModal({
      title: "O'qituvchini o'chirish",
      message: "Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?",
      onConfirm: () => performDeleteTeacher(id),
    })
  }

  return (
    <div className="students-page animate-fade-in">
      {/* HEADER SECTION */}
      <div className="students-header">
        <div className="header-left">
          <h1 className="page-title">{t('pages.teachers')}</h1>
          <p className="page-subtitle">
            Ushbu sahifada siz barcha O'qituvchilar ro'yxatini va ularning ma'lumotlarini topasiz. 
            O'qituvchilarning yo'nalishi, telefon raqami va statusi keltirilgan.
          </p>
        </div>
        <button className="add-student-btn" onClick={() => openModal()}>
          <Plus size={20} />
          {t('actions.addTeacher')}
        </button>
      </div>

      {/* FILTERS & SEARCH CARD */}
      <div className="students-card">
        <div className="card-controls">
          <div className="search-container">
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
          <div className="action-buttons">
            <button className="control-btn">
              <Filter size={18} />
              {t('actions.filters')}
            </button>
            <button
              className={`control-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => handleTabChange('active')}
            >
              {t('actions.active')}
            </button>
            <button
              className={`control-btn ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => handleTabChange('archive')}
            >
              {t('actions.archive')}
            </button>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th>O'qituvchi &darr;</th>
                <th>Guruh</th>
                <th>Telefon raqamlari</th>
                <th>Tug'ilgan sanasi</th>
                <th>Yaratilgan sana</th>
                <th className="actions-col">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <tr key={item} className="skeleton-row">
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '4px' }}></div></td>
                    <td className="skeleton-cell">
                      <div className="skeleton-content">
                        <div className="skeleton-avatar"></div>
                        <div style={{ flex: 1 }}>
                          <div className="skeleton-box" style={{ width: '120px', marginBottom: '6px' }}></div>
                          <div className="skeleton-box" style={{ width: '80px', height: '12px' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px', height: '20px', borderRadius: '4px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '110px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '90px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '60px', borderRadius: '12px' }}></div></td>
                    <td className="skeleton-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
                        <div className="skeleton-box" style={{ width: '40px' }}></div>
                      </div>
                    </td>
                    <td className="skeleton-cell">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
                    {t('empty.teachers')}
                  </td>
                </tr>
              ) : paginatedTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="student-info">
                      {teacher.photo && !failedPhotoIds.includes(teacher.id) ? (
                        <img
                          src={teacher.photo}
                          alt={teacher.name}
                          className="teacher-avatar-img"
                          onError={() => setFailedPhotoIds(prev => prev.includes(teacher.id) ? prev : [...prev, teacher.id])}
                        />
                      ) : (
                        <div className="student-avatar" style={{ backgroundColor: '#f1f5f9' }}>
                          {teacher.initials || getInitials(teacher.name)}
                        </div>
                      )}
                      <div>
                        <span className="student-name">{teacher.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--sub)' }}>{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="group-badges">
                      {teacher.groupList && teacher.groupList.length > 0 ? (
                        teacher.groupList.map((groupName, index) => (
                          <span key={`${teacher.id}-group-${index}`} className="group-tag">
                            {groupName}
                          </span>
                        ))
                      ) : (
                        <span className="group-tag">-</span>
                      )}
                    </div>
                  </td>
                  <td><span className="phone-text">{teacher.phone}</span></td>
                  <td>{teacher.birthDate}</td>
                  <td>{teacher.createdAt}</td>
                  <td>
                    <div className="actions-row">
                      {activeTab === 'active' && (
                        <>
                          <button className="action-icon-btn edit" onClick={() => openModal(teacher)} title="Tahrirlash">
                            <Pencil size={16} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => deleteTeacher(teacher.id)} title="O'chirish">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* MODAL */}
      {isModalOpen && (
        <div className="student-modal-overlay" onClick={closeModal}>
          <div className="student-modal-content" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">O'qituvchi qo'shish</h2>
                <p className="s-modal-subtitle">Bu yerda siz yangi o'qituvchi qo'shishingiz mumkin.</p>
              </div>
              <button className="s-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="s-form-group">
                <label className="s-form-label">Telefon raqam</label>
                <div style={{ display: 'flex' }}>
                  <div className="s-input-prefix" style={{ padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', background: '#f8fafc', color: '#64748b', fontWeight: '500' }}>
                    +998
                  </div>
                  <input 
                    type="text" required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="s-form-input"
                    style={{ borderRadius: '0 10px 10px 0', flex: 1 }}
                  />
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Mail</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Elektron pochtani kiriting"
                    className="s-form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">O'qituvchi FIO</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ma'lumotni kiriting"
                  className="s-form-input"
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Tug'ilgan sanasi</label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    placeholder="01.03.1990"
                    className="s-form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                </div>
              </div>

              <div className="s-form-group" style={{ position: 'relative' }}>
                <label className="s-form-label">Guruh</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <div className="s-form-input" style={{ paddingLeft: '2.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', minHeight: '44px', alignItems: 'center' }}>
                    {formData.groups.map(g => (
                      <span key={g.id} className="s-inline-chip" style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {g.name || g.group_name} <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveGroup(g.id)} />
                      </span>
                    ))}
                    <input 
                      type="text" 
                      style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '50px' }} 
                      value={groupSearch}
                      onChange={e => {
                        setGroupSearch(e.target.value)
                        setShowGroupDropdown(true)
                      }}
                      onFocus={() => setShowGroupDropdown(true)}
                      onBlur={() => setTimeout(() => setShowGroupDropdown(false), 200)}
                    />
                  </div>
                </div>
                {showGroupDropdown && (
                  <div className="s-dropdown-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', marginTop: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    {availableGroups.filter(g => (g.name || g.group_name || '').toLowerCase().includes(groupSearch.toLowerCase())).map(group => (
                      <div 
                        key={group.id} 
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onClick={() => handleAddGroup(group)}
                        className="s-list-item-hover"
                      >
                        {group.name || group.group_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Jinsi</label>
                <div className="s-radio-panel" style={{ display: 'flex', gap: '1.5rem', background: '#fafafa', padding: '0.75rem 1rem', borderRadius: '10px', width: 'max-content' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="gender"
                      value="Erkak"
                      checked={formData.gender === 'Erkak'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ accentColor: '#7c3aed' }}
                    /> Erkak
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="gender"
                      value="Ayol"
                      checked={formData.gender === 'Ayol'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ accentColor: '#7c3aed' }}
                    /> Ayol
                  </label>
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Surati</label>
                <div className="s-upload-zone" style={{ cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  <Upload size={24} className="s-upload-icon" />
                  <p className="s-upload-text">
                    {photoFile ? <span>{photoFile.name}</span> : <><span>Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="s-upload-hint">JPG or PNG (max. 800x800px)</p>
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Parol</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Parolni kiriting"
                  className="s-form-input"
                />
              </div>

              <div className="s-modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem' }}>
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={closeModal}>{t('actions.cancel')}</button>
                <button type="submit" className="s-btn-submit active" disabled={saving} style={{ flex: 'none', padding: '0.75rem 2rem' }}>
                  {saving ? t('actions.saving') : t('actions.save')}
                </button>
              </div>
            </form>
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

export default TeachersPage
