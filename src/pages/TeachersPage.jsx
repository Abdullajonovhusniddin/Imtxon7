import { useState } from 'react'

const initialTeachers = [
  { id: 1, name: 'Husniddin Abdullajonov', email: 'husniddin@example.com', group: 'Frontend', phone: '+998(33)4082808', birthDate: '1998-05-12', coin: '1,250' },
  { id: 2, name: 'Anvar Narzullayev', email: 'anvar@example.com', group: 'Python', phone: '+998(90)1234567', birthDate: '1985-01-24', coin: '2,400' },
  { id: 3, name: 'Sardorbek Shokirov', email: 'sardor@example.com', group: 'JavaScript', phone: '+998(93)5556677', birthDate: '1992-03-15', coin: '980' },
]

function TeachersPage() {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', group: 'Frontend', phone: '', birthDate: '', coin: '0' })

  const openModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher)
      setFormData(teacher)
    } else {
      setEditingTeacher(null)
      setFormData({ name: '', email: '', group: 'Frontend', phone: '', birthDate: '', coin: '0' })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTeacher(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingTeacher) {
      setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...formData, id: t.id } : t))
    } else {
      setTeachers([...teachers, { ...formData, id: Date.now() }])
    }
    closeModal()
  }

  const deleteTeacher = (id) => {
    if (window.confirm("Haqiqatan ham bu o'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter(t => t.id !== id))
    }
  }

  return (
    <div className="teachers-page">
      <div className="teachers-header">
        <div className="header-content">
          <h1>O'qituvchilar Paneli</h1>
          <p className="subtitle">Akademiya o'qituvchilarini boshqarish tizimi.</p>
        </div>
        <button className="add-teacher-btn" onClick={() => openModal()}>
          <span>+</span> Yangi O'qituvchi
        </button>
      </div>

      <div className="teachers-card">
        <div className="teachers-filters">
          <div className="search-wrapper">
            <i>🔍</i>
            <input 
              type="text" 
              placeholder="Qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="export-btn">📥 Eksport</button>
        </div>

        <div className="table-responsive">
          <table className="teachers-table">
            <thead>
              <tr>
                <th>O'qituvchi</th>
                <th>Yo'nalish</th>
                <th>Telefon</th>
                <th>Tug'ilgan Sana</th>
                <th>Coin</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div className="teacher-profile">
                      <div className="avatar-wrapper">
                        {teacher.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="teacher-name">{teacher.name}</span>
                        <span className="teacher-email">{teacher.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill-badge">{teacher.group}</span></td>
                  <td><span style={{fontWeight: 600}}>{teacher.phone}</span></td>
                  <td>{teacher.birthDate}</td>
                  <td>
                    <div className="coin-pill">
                      <span>🪙</span> {teacher.coin}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="icon-btn edit" onClick={() => openModal(teacher)}>✏️</button>
                      <button className="icon-btn delete" onClick={() => deleteTeacher(teacher.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingTeacher ? "Tahrirlash" : "Yangi O'qituvchi"}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>F.I.SH</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Masalan: Husniddin Abdullajonov"
                />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="example@mail.com"
                />
              </div>
              <div className="form-row">
                <label>Yo'nalish</label>
                <select 
                  value={formData.group}
                  onChange={(e) => setFormData({...formData, group: e.target.value})}
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Graphic Design">Graphic Design</option>
                </select>
              </div>
              <div className="form-row">
                <label>Telefon</label>
                <input 
                  type="text" required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+998 (__) ___ __ __"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Bekor qilish</button>
                <button type="submit" className="btn-submit">
                  {editingTeacher ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeachersPage
