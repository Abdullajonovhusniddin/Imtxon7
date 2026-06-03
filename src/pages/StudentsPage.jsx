import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Calendar as CalendarIcon
} from 'lucide-react'
import { buildApiUrl, deleteJson, getJson, patchJson, postJson } from '../api'

const STUDENTS_LIMIT = 10

const getApiItems = (response) => {
  const data = response?.data ?? response

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.students)) return data.students
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.rows)) return data.rows

  return []
}

const getApiTotal = (response) => {
  const data = response?.data ?? response
  const total =
    data?.total ??
    data?.count ??
    data?.total_count ??
    data?.totalCount ??
    data?.meta?.total ??
    data?.pagination?.total

  if (total !== undefined && total !== null && !Number.isNaN(Number(total))) {
    return Number(total)
  }

  return getApiItems(response).length
}

const normalizePhoto = (photo) => {
  if (!photo || typeof photo !== 'string') return photo
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo
  if (photo.startsWith('/')) return buildApiUrl(photo)
  return photo
}

const mapStudent = (item = {}) => {
  const name = item.full_name || item.name || item.fullName || "Noma'lum"
  const groupItems = [
    ...(Array.isArray(item.groups) ? item.groups : []),
    ...(Array.isArray(item.Groups) ? item.Groups : []),
    ...(Array.isArray(item.StudentGroup) ? item.StudentGroup.map(row => row?.Group || row?.group || row) : []),
  ].filter(Boolean)
  const groupNames = groupItems
    .map(group => group?.group_name || group?.name || group?.title || group)
    .filter(Boolean)

  return {
    ...item,
    id: item.id || item.student_id || item.user_id || item._id || Math.random(),
    name,
    group: groupNames[0] || item.group_name || item.group || 'Guruhsiz',
    groupList: groupNames,
    subGroup: item.direction || '',
    phone: item.phone || item.phone_number || item.mobile || '-',
    email: item.email || '-',
    birthDate: item.birth_date || item.birthDate || item.dob || '',
    address: item.address || '-',
    createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'),
    initial: (name || 'N')[0].toUpperCase(),
    color: '#ede9fe',
    photo: normalizePhoto(item.photo || item.image || item.avatar || item.photo_url || item.photoUrl || item.profile_photo || item.picture)
  }
}

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupsLoaded, setGroupsLoaded] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [selectedGroups, setSelectedGroups] = useState([])
  const [isGroupAssignOpen, setIsGroupAssignOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    password: '',
  })

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', birthDate: '', address: '', password: '' })
  }

  const openModal = (student = null) => {
    setEditingStudent(student)
    setGroupSearch('')
    setSelectedGroups([])
    setIsGroupAssignOpen(false)
    setPhotoFile(null)
    if (student) {
      setFormData({
        name: student.name || student.full_name || '',
        email: student.email === '-' ? '' : student.email || '',
        phone: student.phone === '-' ? '' : student.phone || '',
        birthDate: student.birthDate === '-' ? '' : student.birthDate || student.birth_date || '',
        address: student.address === '-' ? '' : student.address || '',
        password: '',
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
    setGroupSearch('')
    setSelectedGroups([])
    setIsGroupAssignOpen(false)
    setPhotoFile(null)
    resetForm()
  }

  const loadGroupsForAssign = async () => {
    if (groupsLoaded) return
    try {
      const groupsResponse = await getJson('/groups/all')
      const groupsData = groupsResponse.data || groupsResponse
      if (Array.isArray(groupsData)) {
        setAvailableGroups(groupsData)
      }
      setGroupsLoaded(true)
    } catch (err) {
      console.error('Groups API Error:', err)
    }
  }

  const openGroupAssign = () => {
    setGroupSearch('')
    setIsGroupAssignOpen(true)
    loadGroupsForAssign()
  }

  const closeGroupAssign = () => {
    setIsGroupAssignOpen(false)
    setGroupSearch('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('full_name', formData.name)
      if (formData.password) fd.append('password', formData.password)
      if (formData.birthDate) fd.append('birth_date', formData.birthDate)
      if (formData.address) fd.append('address', formData.address)
      if (formData.email) fd.append('email', formData.email)
      if (formData.phone) fd.append('phone', formData.phone)
      if (photoFile) fd.append('photo', photoFile)

      const response = editingStudent
        ? await patchJson(`/students/${editingStudent.id}`, fd)
        : await postJson('/students', fd)
      const newStudent = response?.data || response
      const newStudentId = newStudent?.id || newStudent?.student_id || newStudent?.user_id

      if (!editingStudent && selectedGroups.length > 0) {
        if (!newStudentId) {
          throw new Error("Talaba yaratildi, lekin guruhga biriktirish uchun talaba ID topilmadi.")
        }

        await Promise.all(selectedGroups.map(groupId =>
          postJson('/student-group', {
            student_id: Number(newStudentId) || newStudentId,
            group_id: Number(groupId) || groupId
          })
        ))
      }

      const mappedStudent = mapStudent({
        ...editingStudent,
        ...newStudent,
        id: newStudentId || editingStudent?.id || Date.now(),
        full_name: newStudent?.full_name || formData.name,
        phone: newStudent?.phone || formData.phone,
        email: newStudent?.email || formData.email,
        birth_date: newStudent?.birth_date || formData.birthDate,
        address: newStudent?.address || formData.address,
      })

      if (editingStudent) {
        setStudents(prev => prev.map(student => String(student.id) === String(editingStudent.id) ? mappedStudent : student))
      } else {
        setStudents(prev => [mappedStudent, ...prev])
        setTotal(prev => prev + 1)
      }

      closeModal()
    } catch (err) {
      console.error('Student save error:', err)
      alert(err.message || 'Talaba saqlashda xatolik yuz berdi.')
    } finally {
      setSaving(false)
    }
  }

  const loadData = async (nextPage = page, nextTab = activeTab) => {
    setLoading(true)
    setApiError('')
    try {
      const response = nextTab === 'archive'
        ? await getJson('/students/archive')
        : await getJson('/students', { params: { page: nextPage, limit: STUDENTS_LIMIT } })

      const mappedData = getApiItems(response).map(mapStudent)
      setStudents(mappedData)
      setTotal(nextTab === 'archive' ? mappedData.length : getApiTotal(response))
    } catch (err) {
      console.error('Students API Error:', err)
      setApiError("Talabalar ma'lumotlarini yuklashda xatolik yuz berdi.")
      setStudents([])
    }

    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => loadData(1, 'active'))
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    loadData(1, tab)
  }

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || loading) return
    setPage(nextPage)
    loadData(nextPage, activeTab)
  }

  const openStudentView = async (student) => {
    setViewingStudent(student)
    setViewLoading(true)
    try {
      const response = await getJson(`/students/one/${student.id}`)
      setViewingStudent(mapStudent(response?.data || response || student))
    } catch (err) {
      console.error('Student one API Error:', err)
      alert(err.message || "Talaba ma'lumotlarini yuklashda xatolik yuz berdi.")
    } finally {
      setViewLoading(false)
    }
  }

  const closeStudentView = () => {
    setViewingStudent(null)
    setViewLoading(false)
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    String(s.email).toLowerCase().includes(search.toLowerCase())
  )

  const deleteStudent = async (id) => {
    if (!window.confirm("Haqiqatan ham bu talabani o'chirmoqchimisiz?")) return

    try {
      await deleteJson(`/students/${id}`)
      setStudents(prev => prev.filter(student => student.id !== id))
    } catch (err) {
      console.error('Student delete error:', err)
      alert(err.message || "Talabani o'chirishda xatolik yuz berdi.")
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / STUDENTS_LIMIT))

  return (
    <div className="students-page animate-fade-in max-lg:!gap-4">
      {/* HEADER SECTION */}
      <div className="students-header max-lg:!flex max-lg:!flex-row max-lg:!items-start max-lg:!justify-between max-lg:!gap-4 max-md:!grid max-md:!grid-cols-1 max-md:!gap-3">
        <div className="header-left">
          <h1 className="page-title max-md:!text-3xl max-md:!leading-tight">Talabalar</h1>
          <p className="page-subtitle max-md:!max-w-full max-md:!text-sm">
            Ushbu sahifada siz Talabalar ro'yxatini va ularning ma'lumotlarini topasiz.
            Har bir Talaba ismi, fanlari va aloqa ma'lumotlari keltirilgan.
          </p>
        </div>
        <button className="add-student-btn max-lg:!w-auto max-lg:!min-w-fit max-lg:!rounded-xl max-md:!w-full max-md:!justify-center" onClick={() => openModal()}>
          <Plus size={20} />
          Talaba qo'shish
        </button>
      </div>

      {/* FILTERS & SEARCH CARD */}
      <div className="students-card max-md:!rounded-2xl max-sm:!p-3">
        <div className="card-controls max-lg:!flex max-lg:!flex-row max-md:!grid max-md:!grid-cols-1 max-md:!gap-3">
          <div className="search-container max-md:!max-w-none">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="action-buttons max-lg:!flex max-lg:!flex-row max-md:!grid max-md:!grid-cols-2 max-sm:!grid-cols-1 max-md:!gap-2">
            <button className="control-btn max-md:!justify-center" type="button" onClick={() => loadData(page, activeTab)}>
              <Filter size={18} />
              Yangilash
            </button>
            <button
              className="control-btn max-md:!justify-center"
              type="button"
              onClick={() => handleTabChange(activeTab === 'archive' ? 'active' : 'archive')}
              style={activeTab === 'archive' ? { borderColor: '#7c3aed', color: '#7c3aed' } : undefined}
            >
              {activeTab === 'archive' ? 'Faol talabalar' : 'Arxiv'}
            </button>
          </div>
        </div>
        {apiError && (
          <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: '12px', background: '#fef3c7', color: '#92400e' }}>
            {apiError}
          </div>
        )}

        {/* TABLE SECTION */}
        <div className="table-wrapper max-md:!-mx-5 max-md:!overflow-x-auto max-md:!px-5">
          <table className="students-table max-md:!table max-md:!min-w-[920px] max-md:!w-full max-sm:!min-w-[820px]">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th>Nomi &darr;</th>
                <th>Guruh</th>
                <th>Telefon raqamlari</th>
                <th>Email</th>
                <th>Tug'ilgan sanasi</th>
                <th>Manzil</th>
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
                          <div className="skeleton-box" style={{ width: '100px', marginBottom: '6px' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '60px', marginBottom: '4px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '100px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '120px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '150px' }}></div></td>
                    <td className="skeleton-cell"><div className="skeleton-box" style={{ width: '80px' }}></div></td>
                    <td className="skeleton-cell">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                        <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--sub)' }}>
                    {activeTab === 'archive' ? 'Arxivlangan talabalar topilmadi.' : 'Talabalar topilmadi.'}
                  </td>
                </tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="student-info">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="student-avatar-img" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div className="student-avatar" style={{ backgroundColor: student.color || '#f1f5f9' }}>
                          {student.initial}
                        </div>
                      )}
                      <span className="student-name">{student.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="group-badges">
                      {(student.groupList?.length > 0 ? student.groupList : [student.group]).map((groupName, index) => (
                        <span key={`${student.id}-group-${index}`} className="group-tag">{groupName}</span>
                      ))}
                      {student.subGroup && <span className="subgroup-tag">{student.subGroup}</span>}
                    </div>
                  </td>
                  <td><span className="phone-text">{student.phone}</span></td>
                  <td><span className="email-text">{student.email}</span></td>
                  <td>{student.birthDate}</td>
                  <td>{student.address}</td>
                  <td>{student.createdAt}</td>
                  <td>
                    <div className="actions-row">
                      <button className="action-icon-btn" title="Ko'rish" onClick={() => openStudentView(student)}><Eye size={16} /></button>
                      <button className="action-icon-btn delete" title="O'chirish" onClick={() => deleteStudent(student.id)}><Trash2 size={16} /></button>
                      <button className="action-icon-btn edit" title="Tahrirlash" onClick={() => openModal(student)}><Pencil size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination max-lg:!static max-lg:!m-0 max-lg:!rounded-none max-lg:!bg-transparent max-lg:!p-0 max-lg:!shadow-none max-sm:!gap-2">
          <button className="pagination-arrow" onClick={() => handlePageChange(page - 1)} disabled={activeTab === 'archive' || page <= 1 || loading}>
            <ChevronLeft size={18} />
            Previous
          </button>
          <div className="page-numbers">
            <button className="page-num active">{page} / {totalPages}</button>
          </div>
          <button className="pagination-arrow" onClick={() => handlePageChange(page + 1)} disabled={activeTab === 'archive' || page >= totalPages || loading}>
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* STUDENT MODAL */}
      {isModalOpen && (
        <div className="student-modal-overlay max-md:!items-stretch max-md:!justify-end max-md:!p-0" onClick={closeModal}>
          <div className="student-modal-content max-md:!h-dvh max-md:!max-h-dvh max-md:!w-full max-md:!max-w-[460px] max-md:!rounded-none max-md:!p-5" onClick={e => e.stopPropagation()}>

            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">{editingStudent ? 'Talabani tahrirlash' : "Talaba qo'shish"}</h2>
                <p className="s-modal-subtitle">
                  {editingStudent ? "Talaba ma'lumotlarini yangilang." : "Yangi talabani ro'yxatdan o'tkazing."}
                </p>
              </div>
              <button className="s-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div className="s-form-group">
                <label className="s-form-label">To'liq ismi *</label>
                <input
                  type="text"
                  className="s-form-input"
                  placeholder="Ism Familiya"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Telefon</label>
                <input
                  type="text"
                  className="s-form-input"
                  placeholder="+998901234567"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Email</label>
                <input
                  type="email"
                  className="s-form-input"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Tug'ilgan sanasi</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="s-form-input"
                    style={{ width: '100%' }}
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                  <CalendarIcon size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Manzil</label>
                <input
                  type="text"
                  className="s-form-input"
                  placeholder="Manzilni kiriting"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Parol {editingStudent ? '' : '*'}</label>
                <input
                  type="password"
                  className="s-form-input"
                  placeholder={editingStudent ? "O'zgartirish kerak bo'lsa kiriting" : "Parolni kiriting"}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingStudent}
                />
              </div>

              {!editingStudent && (
              <div className="s-form-group">
                <label className="s-form-label">Guruh</label>
                <button type="button" className="s-group-open-btn" onClick={openGroupAssign}>
                  <Plus size={18} /> Guruh qo'shish
                </button>
                {selectedGroups.length > 0 && (
                  <div className="selected-group-tags" style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedGroups.map(groupId => {
                      const group = availableGroups.find(g => String(g.id || g.name) === String(groupId))
                      return (
                        <span key={groupId} className="group-chip" style={{ padding: '0.5rem 0.75rem', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {group?.group_name || group?.name || groupId}
                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedGroups(prev => prev.filter(id => id !== groupId))} />
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              )}

              <div className="s-form-group">
                <label className="s-form-label">Surati</label>
                <div className="s-upload-zone" style={{ cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    onChange={e => setPhotoFile(e.target.files[0])}
                  />
                  <Upload size={24} className="s-upload-icon" />
                  <p className="s-upload-text">
                    {photoFile ? <span style={{ color: '#7c3aed' }}>{photoFile.name}</span> : <><span>Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="s-upload-hint">JPG or PNG (max. 2 MB)</p>
                </div>
              </div>

              <div className="s-modal-actions">
                <button type="button" className="s-btn-cancel" onClick={closeModal}>Bekor qilish</button>
                <button type="submit" className="s-btn-submit active" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {viewingStudent && (
        <div className="student-modal-overlay max-md:!items-stretch max-md:!justify-end max-md:!p-0" onClick={closeStudentView}>
          <div className="student-modal-content max-md:!h-dvh max-md:!max-h-dvh max-md:!w-full max-md:!max-w-[460px] max-md:!rounded-none max-md:!p-5" onClick={e => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Talaba profili</h2>
                <p className="s-modal-subtitle">
                  {viewLoading ? "Ma'lumotlar yuklanmoqda..." : viewingStudent.name}
                </p>
              </div>
              <button className="s-modal-close" onClick={closeStudentView}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="student-info" style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                {viewingStudent.photo ? (
                  <img src={viewingStudent.photo} alt={viewingStudent.name} className="student-avatar-img" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div className="student-avatar" style={{ width: 56, height: 56, backgroundColor: viewingStudent.color || '#f1f5f9' }}>
                    {viewingStudent.initial}
                  </div>
                )}
                <div>
                  <strong className="student-name">{viewingStudent.name}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{viewingStudent.email}</div>
                </div>
              </div>

              {[
                ['Telefon', viewingStudent.phone],
                ["Tug'ilgan sana", viewingStudent.birthDate || '-'],
                ['Manzil', viewingStudent.address],
                ['Guruh', viewingStudent.groupList?.join(', ') || viewingStudent.group],
                ['Yaratilgan sana', viewingStudent.createdAt],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <strong style={{ textAlign: 'right', color: '#0f172a' }}>{value || '-'}</strong>
                </div>
              ))}

              <div className="s-modal-actions">
                <button type="button" className="s-btn-cancel" onClick={closeStudentView}>Yopish</button>
                <button type="button" className="s-btn-submit active" onClick={() => {
                  const current = viewingStudent
                  closeStudentView()
                  openModal(current)
                }}>
                  Tahrirlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGroupAssignOpen && (
        <div className="group-assign-overlay max-md:!items-center max-md:!p-4" onClick={closeGroupAssign}>
          <div className="group-assign-modal max-md:!max-h-[90dvh] max-md:!rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Guruhga biriktirish</h2>
                <p className="s-modal-subtitle">Bir yoki bir nechta guruhni tanlang</p>
              </div>
              <button className="s-modal-close" onClick={closeGroupAssign}>
                <X size={24} />
              </button>
            </div>

            <div className="s-form-group">
              <input
                type="text"
                className="s-form-input"
                placeholder="Guruh qidirish..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
              />
            </div>

            <div className="group-assign-list">
              {availableGroups.length > 0 ? (
                availableGroups
                  .filter(group => (group.name || group.group_name || '').toLowerCase().includes(groupSearch.toLowerCase()))
                  .map((group, index, arr) => {
                    const groupKey = String(group.id || group.name)
                    const isSelected = selectedGroups.includes(groupKey)
                    return (
                      <label
                        key={groupKey}
                        className="s-list-item-hover"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '0.95rem 1rem',
                          cursor: 'pointer',
                          borderBottom: index !== arr.length - 1 ? '1px solid #e2e8f0' : 'none',
                          background: isSelected ? '#eef2ff' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedGroups(prev => prev.includes(groupKey) ? prev.filter(id => id !== groupKey) : [...prev, groupKey])
                            }}
                            style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                          />
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{group.group_name || group.name || group.full_name}</span>
                        </div>
                        {isSelected && <span style={{ color: '#7c3aed', fontWeight: '700' }}>Tanlangan</span>}
                      </label>
                    )
                  })
              ) : (
                <div style={{ padding: '1rem', color: '#64748b' }}>Guruhlar yuklanmoqda...</div>
              )}
            </div>

            <div className="s-modal-actions" style={{ justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" className="s-btn-cancel" onClick={closeGroupAssign}>Bekor qilish</button>
              <button type="button" className="s-btn-submit active" onClick={closeGroupAssign}>Qo'shish</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default StudentsPage
