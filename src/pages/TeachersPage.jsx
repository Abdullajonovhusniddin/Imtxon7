import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Coins, 
  Pencil, 
  Trash2, 
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Upload,
  Calendar as CalendarIcon,
  Mail
} from 'lucide-react'
import { getJson } from '../api'

const API_BASE = 'https://najot-edu.softwareengineer.uz/api/v1'

const postFormData = async (path, formData) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const text = await response.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'API error'
    throw new Error(message)
  }
  return data
}

function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', address: '', groups: [], phone: '', birthDate: '', coin: '0', status: 'Aktiv' })
  
  // Group select states
  const [availableGroups, setAvailableGroups] = useState([])
  const [groupSearch, setGroupSearch] = useState('')
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const teachersPerPage = 5

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getJson('/teachers')
        const data = response.data || response
        if (Array.isArray(data)) {
          const mapped = data.map(t => ({
            ...t,
            name: t.full_name || t.name || "Noma'lum",
            phone: t.phone || '-',
            email: t.email || '-',
            birthDate: t.birth_date || t.birthDate || '-',
            group: t.group_name || t.group || '-',
            coin: t.coin || '0',
            status: t.status || 'Aktiv',
          }))
          setTeachers(mapped)
        }
      } catch (err) {
        console.error('Teachers API Error:', err)
        setTeachers([
          { id: 1, name: 'Husniddin Abdullajonov', email: 'husniddin@example.com', group: 'Frontend', phone: '+998(33)4082808', birthDate: '1998-05-12', coin: '1,250', status: 'Aktiv' },
          { id: 2, name: 'Anvar Narzullayev', email: 'anvar@example.com', group: 'Python', phone: '+998(90)1234567', birthDate: '1985-01-24', coin: '2,400', status: 'Aktiv' },
          { id: 3, name: 'Sardorbek Shokirov', email: 'sardor@example.com', group: 'JavaScript', phone: '+998(93)5556677', birthDate: '1992-03-15', coin: '980', status: 'Aktiv' },
          { id: 4, name: 'Malika Ergasheva', email: 'malika@example.com', group: 'Graphic Design', phone: '+998(94)1112233', birthDate: '1995-11-20', coin: '1,850', status: 'Aktiv' },
          { id: 5, name: 'Jasur Mavlonov', email: 'jasur@example.com', group: 'Mobile', phone: '+998(99)8887766', birthDate: '1990-07-08', coin: '3,200', status: "Ta'tilda" },
        ])
      }


      try {
        const groupsResponse = await getJson('/groups/all')
        const groupsData = groupsResponse.data || groupsResponse
        if (Array.isArray(groupsData)) setAvailableGroups(groupsData)
      } catch (err) {
        console.error('Group list API Error:', err)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredTeachers = teachers.filter((t) => {
    const fullName = String(t.name || t.full_name || '')
    return fullName.toLowerCase().includes(search.toLowerCase())
  })

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / teachersPerPage))
  const currentTeachers = filteredTeachers.slice((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage)

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handlePrevPage = () => handlePageChange(currentPage - 1)
  const handleNextPage = () => handlePageChange(currentPage + 1)

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

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

  const openModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher)
      // Ensure groups is an array even if the mock data had a string 'group'
      setFormData({ ...teacher, address: teacher.address || '', groups: teacher.groups || [] })
    } else {
      setEditingTeacher(null)
      setFormData({ name: '', email: '', address: '', groups: [], phone: '', birthDate: '', coin: '0', status: 'Aktiv' })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTeacher(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTeacher) {
        setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...formData, id: t.id } : t))
        closeModal()
        return
      }

      // API requires multipart/form-data
      const fd = new FormData()
      fd.append('full_name', formData.name)
      fd.append('email', formData.email)
      fd.append('phone', formData.phone)
      fd.append('address', formData.address || '')
      fd.append('birth_date', formData.birthDate || '')

      const groupIds = Array.isArray(formData.groups)
        ? formData.groups.map(g => g.id || g.group_id || g.groupId || g)
        : []
      groupIds.forEach(id => fd.append('groups', id))

      const created = await postFormData('/teachers', fd)
      const createdTeacher = created?.data || created
      setTeachers(prev => [...prev, {
        ...createdTeacher,
        id: createdTeacher?.id || Date.now(),
        name: createdTeacher?.full_name || formData.name,
        email: createdTeacher?.email || formData.email,
        phone: createdTeacher?.phone || formData.phone,
        birthDate: createdTeacher?.birth_date || formData.birthDate,
        group: formData.groups[0]?.name || formData.groups[0]?.group_name || '-',
        coin: '0',
        status: 'Aktiv',
      }])

      closeModal()
    } catch (err) {
      console.error('Teacher save error:', err)
      alert(err.message || "O'qituvchi saqlashda xatolik yuz berdi.")
    }
  }

  const deleteTeacher = (id) => {
    if (window.confirm("Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter(t => t.id !== id))
    }
  }

  return (
    <div className="students-page animate-fade-in">
      {/* HEADER SECTION */}
      <div className="students-header">
        <div className="header-left">
          <h1 className="page-title">O'qituvchilar</h1>
          <p className="page-subtitle">
            Ushbu sahifada siz barcha O'qituvchilar ro'yxatini va ularning ma'lumotlarini topasiz. 
            O'qituvchilarning yo'nalishi, telefon raqami va statusi keltirilgan.
          </p>
        </div>
        <button className="add-student-btn" onClick={() => openModal()}>
          <Plus size={20} />
          O'qituvchi qo'shish
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

        {/* TABLE SECTION */}
        <div className="table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th>O'qituvchi &darr;</th>
                <th>Yo'nalish</th>
                <th>Telefon</th>
                <th>Tug'ilgan Sana</th>
                <th>Status</th>
                <th>Coin</th>
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
              ) : currentTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="student-info">
                      <div className="student-avatar" style={{ backgroundColor: '#f1f5f9' }}>
                        {teacher.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="student-name">{teacher.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--sub)' }}>{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="group-tag">{teacher.group}</span></td>
                  <td><span className="phone-text">{teacher.phone}</span></td>
                  <td>{teacher.birthDate}</td>
                  <td>
                    <span className={`pill-badge ${teacher.status === 'Aktiv' ? 'status-active' : 'status-away'}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td>
                    <div className="coin-pill">
                      <Coins size={14} color="#b45309" />
                      {teacher.coin}
                    </div>
                  </td>
                  <td>
                    <div className="actions-row">
                      <button className="action-icon-btn edit" onClick={() => openModal(teacher)} title="Tahrirlash">
                        <Pencil size={16} />
                      </button>
                      <button className="action-icon-btn delete" onClick={() => deleteTeacher(teacher.id)} title="O'chirish">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button className="pagination-arrow" onClick={handlePrevPage} disabled={currentPage === 1}>
            <ChevronLeft size={18} />
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1
              return (
                <button
                  key={page}
                  className={`page-num ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button className="pagination-arrow" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
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
                  <div style={{ padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', background: '#f8fafc', color: '#64748b', fontWeight: '500' }}>
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
                      <span key={g.id} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', marginTop: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
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
                <div style={{ display: 'flex', gap: '1.5rem', background: '#fafafa', padding: '0.75rem 1rem', borderRadius: '10px', width: 'max-content' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="gender" value="Erkak" style={{ accentColor: '#7c3aed' }} /> Erkak
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="gender" value="Ayol" style={{ accentColor: '#7c3aed' }} /> Ayol
                  </label>
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Surati</label>
                <div className="s-upload-zone">
                  <Upload size={24} className="s-upload-icon" />
                  <p className="s-upload-text"><span>Click to upload</span> or drag and drop</p>
                  <p className="s-upload-hint">JPG or PNG (max. 800x800px)</p>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <Plus size={16} /> Parol qoshish
                  </button>
                </div>
              </div>

              <div className="s-modal-actions" style={{ justifyContent: 'flex-end', paddingTop: '1rem' }}>
                <button type="button" className="s-btn-cancel" style={{ flex: 'none', padding: '0.75rem 1.5rem' }} onClick={closeModal}>Bekor qilish</button>
                <button type="submit" className="s-btn-submit" style={{ flex: 'none', padding: '0.75rem 2rem' }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeachersPage
