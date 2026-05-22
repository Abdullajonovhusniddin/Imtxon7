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
import { buildApiUrl, deleteJson, getJson, postJson } from '../api'

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [apiError, setApiError] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableGroups, setAvailableGroups] = useState([])
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

  const openModal = () => {
    setGroupSearch('')
    setSelectedGroups([])
    setIsGroupAssignOpen(false)
    setPhotoFile(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setGroupSearch('')
    setSelectedGroups([])
    setIsGroupAssignOpen(false)
    setPhotoFile(null)
    setFormData({ name: '', email: '', phone: '', birthDate: '', address: '', password: '' })
  }

  const openGroupAssign = () => {
    setGroupSearch('')
    setIsGroupAssignOpen(true)
  }

  const closeGroupAssign = () => {
    setIsGroupAssignOpen(false)
    setGroupSearch('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('full_name', formData.name)
      fd.append('password', formData.password)
      fd.append('birth_date', formData.birthDate)
      fd.append('address', formData.address)
      if (formData.email) fd.append('email', formData.email)
      if (formData.phone) fd.append('phone', formData.phone)
      if (photoFile) fd.append('photo', photoFile)
      selectedGroups.forEach(groupId => fd.append('groups', groupId))

      const created = await postJson('/students/archive/students', fd)
      const newStudent = created?.data || created

      setStudents(prev => [...prev, {
        id: newStudent?.id || Date.now(),
        name: newStudent?.full_name || formData.name,
        group: selectedGroups.length > 0 ? (availableGroups.find(g => (g.id || g.name) === selectedGroups[0])?.name || 'Guruhli') : 'Guruhsiz',
        subGroup: '',
        phone: newStudent?.phone || formData.phone || '-',
        email: newStudent?.email || formData.email || '-',
        birthDate: newStudent?.birth_date || formData.birthDate || '-',
        address: newStudent?.address || formData.address || '-',
        createdAt: new Date().toLocaleDateString(),
        initial: (formData.name || 'N')[0].toUpperCase(),
        color: '#ede9fe'
      }])

      closeModal()
    } catch (err) {
      console.error('Student save error:', err)
      alert(err.message || 'Talaba saqlashda xatolik yuz berdi.')
    }
  }

  const loadData = async () => {
    setApiError('')
    try {
      const response = await getJson('/students')
      const data = response.data || response
      if (Array.isArray(data)) {
        const mappedData = data.map(item => {
          const name = item.full_name || item.name || item.fullName || "Noma'lum"
          let photo = item.photo || item.image || item.avatar || item.photo_url || item.photoUrl || item.profile_photo || item.picture
          if (photo && typeof photo === 'string' && photo.startsWith('/')) {
            photo = buildApiUrl(`/students/archive${photo}`)
          }

          return ({
            id: item.id || item.user_id || Math.random(),
            name,
            group: item.group_name || item.group || 'Guruhsiz',
            subGroup: item.direction || '',
            phone: item.phone || item.phone_number || item.mobile || '-',
            email: item.email || '-',
            birthDate: item.birth_date || item.birthDate || item.dob || '-',
            address: item.address || '-',
            createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'),
            initial: (name || 'N')[0].toUpperCase(),
            color: '#ede9fe',
            photo
          })
        })
        setStudents(mappedData)
      }
    } catch (err) {
      console.error('Students API Error:', err)
      setApiError("Talabalar ma'lumotlarini yuklashda xatolik yuz berdi.")
      setStudents([])
    }

    try {
      const groupsResponse = await getJson('/groups/all')
      const groupsData = groupsResponse.data || groupsResponse
      if (Array.isArray(groupsData)) {
        setAvailableGroups(groupsData)
      }
    } catch (err) {
      console.error('Groups API Error:', err)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

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

  return (
    <div className="students-page animate-fade-in">
      {/* HEADER SECTION */}
      <div className="students-header">
        <div className="header-left">
          <h1 className="page-title">Talabalar</h1>
          <p className="page-subtitle">
            Ushbu sahifada siz Talabalar ro'yxatini va ularning ma'lumotlarini topasiz.
            Har bir Talaba ismi, fanlari va aloqa ma'lumotlari keltirilgan.
          </p>
        </div>
        <button className="add-student-btn" onClick={openModal}>
          <Plus size={20} />
          Talaba qo'shish
        </button>
      </div>

      {/* FILTERS & SEARCH CARD */}
      <div className="students-card">
        <div className="card-controls">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="action-buttons">
            <button className="control-btn">
              <Filter size={18} />
              Filters
            </button>
            <button className="control-btn">
              Arxiv
            </button>
          </div>
        </div>
        {apiError && (
          <div style={{ margin: '1rem 0', padding: '1rem', borderRadius: '12px', background: '#fef3c7', color: '#92400e' }}>
            {apiError}
          </div>
        )}

        {apiError && (
          <div className="api-error-banner" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '12px', background: '#ffedd5', color: '#b45309' }}>
            {apiError}
          </div>
        )}

        {/* TABLE SECTION */}
        <div className="table-wrapper">
          <table className="students-table">
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
                      <span className="group-tag">{student.group}</span>
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
                      <button className="action-icon-btn" title="Ko'rish"><Eye size={16} /></button>
                      <button className="action-icon-btn delete" title="O'chirish" onClick={() => deleteStudent(student.id)}><Trash2 size={16} /></button>
                      <button className="action-icon-btn edit" title="Tahrirlash"><Pencil size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* STUDENT MODAL */}
      {isModalOpen && (
        <div className="student-modal-overlay" onClick={closeModal}>
          <div className="student-modal-content" onClick={e => e.stopPropagation()}>

            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Talaba qo'shish</h2>
                <p className="s-modal-subtitle">Bu yerda siz yangi Talaba qo'shishingiz mumkin.</p>
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
                <label className="s-form-label">Parol *</label>
                <input
                  type="password"
                  className="s-form-input"
                  placeholder="Parolni kiriting"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

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
                <button type="submit" className="s-btn-submit active">Saqlash</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {isGroupAssignOpen && (
        <div className="group-assign-overlay" onClick={closeGroupAssign}>
          <div className="group-assign-modal" onClick={(e) => e.stopPropagation()}>
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
