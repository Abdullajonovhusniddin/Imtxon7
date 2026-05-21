import React, { useState, useEffect } from 'react'
import { getJson, postJson } from '../api'
import { 
  BookOpen, 
  Home, 
  MapPin, 
  Users, 
  FileText,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react'

const subPageData = {
  kurslar: { title: 'Kurslar', icon: BookOpen, desc: 'Akademiyadagi barcha mavjud kurslar ro\'yxati.' },
  xonalar: { title: 'Xonalar', icon: Home, desc: 'Dars xonalari va jihozlanishi.' },
  // filial: { title: 'Filiallar', icon: MapPin, desc: 'O\'quv markazining filiallari.' },
  hodimlar: { title: 'Hodimlar', icon: Users, desc: 'Akademiya hodimlari.' },
}

function DynamicSubPage({ id }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Human Resources Manager', branch: 'Filial 1', description: 'A little about the company and the team that you’ll be working with.', lessonDuration: '90 min', courseLength: '3 oy', price: '1 000 000 mln', color: '#eff6ff' },
    { id: 2, name: 'Human Resources Manager', branch: 'Filial 2', description: 'A little about the company and the team that you’ll be working with.', lessonDuration: '90 min', courseLength: '3 oy', price: '1 000 000 mln', color: '#f5f3ff' },
    { id: 3, name: 'Human Resources Manager', branch: 'Filial 1', description: 'A little about the company and the team that you’ll be working with.', lessonDuration: '90 min', courseLength: '3 oy', price: '1 000 000 mln', color: '#fef9c3' },
    { id: 4, name: 'Human Resources Manager', branch: 'Filial 2', description: 'A little about the company and the team that you’ll be working with.', lessonDuration: '90 min', courseLength: '3 oy', price: '1 000 000 mln', color: '#dcfce7' },
  ])

  const branchFilters = ['Filial 1', 'Filial 2', 'Arxiv']
  const [selectedBranch, setSelectedBranch] = useState('Filial 1')

  const branchOptions = ['Filial 1', 'Filial 2', 'Filial 3']
  const lessonDurations = ['30 min', '60 min', '90 min', '120 min']
  const courseLengths = ['1 oy', '2 oy', '3 oy', '4 oy', '6 oy']
  const colorOptions = ['#111827', '#7c3aed', '#dc2626', '#ea580c', '#15803d', '#0ea5e9', '#9333ea', '#f43f5e']

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    branches: [],
    lessonDuration: '',
    courseLength: '',
    price: '',
    description: '',
    color: '#7c3aed',
    students: 0,
  })

  // Load courses from API
  useEffect(() => {
    if (id !== 'kurslar') return
    const load = async () => {
      setApiLoading(true)
      try {
        const res = await getJson('/courses')
        const data = res?.data || res
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.map(c => ({
            id: c.id || Math.random(),
            name: c.name || c.title || "Noma'lum kurs",
            branch: c.branch || c.filial || 'Filial 1',
            description: c.description || 'Kurs haqida ma\'lumot.',
            lessonDuration: c.lesson_duration || c.lessonDuration || '90 min',
            courseLength: c.course_length || c.courseLength || '3 oy',
            price: c.price ? String(c.price) : '0',
            color: c.color || '#eff6ff',
          })))
        }
      } catch (err) {
        console.error('Courses API Error:', err)
      }
      setApiLoading(false)
    }
    load()
  }, [id])

  const data = subPageData[id] || { title: 'Sahifa', icon: FileText, desc: 'Ma\'lumot topilmadi.' }
  const PageIcon = data.icon

  const toggleBranch = (branch) => {
    setNewItem((prev) => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter((b) => b !== branch)
        : [...prev.branches, branch],
    }))
  }

  const selectAllBranches = () => {
    setNewItem((prev) => ({
      ...prev,
      branches: prev.branches.length === branchOptions.length ? [] : branchOptions,
    }))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const localItem = {
      ...newItem,
      id: Date.now(),
      branch: newItem.branches[0] || 'Filial 1',
      color: newItem.color,
      description: newItem.description || 'Kurs haqida ma\'lumot.',
      lessonDuration: newItem.lessonDuration || '90 min',
      courseLength: newItem.courseLength || '3 oy',
    }

    if (id === 'kurslar') {
      try {
        const payload = {
          name: newItem.name,
          description: newItem.description,
          price: Number(newItem.price) || 0,
          lesson_duration: newItem.lessonDuration,
          course_length: newItem.courseLength,
          color: newItem.color,
        }
        const created = await postJson('/courses', payload)
        const createdItem = created?.data || created
        setItems(prev => [...prev, { ...localItem, id: createdItem?.id || Date.now() }])
      } catch (err) {
        console.error('Course create error:', err)
        setItems(prev => [...prev, localItem])
      }
    } else {
      setItems(prev => [...prev, localItem])
    }

    setIsModalOpen(false)
    setNewItem({ name: '', branches: [], lessonDuration: '', courseLength: '', price: '', description: '', color: '#7c3aed', students: 0 })
  }

  const deleteItem = (id) => {
    if(window.confirm('O\'chirmoqchimisiz?')) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const filteredItems = items.filter((item) => {
    if (selectedBranch === 'Arxiv') return item.branch === 'Arxiv'
    return item.branch === selectedBranch
  })

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PageIcon size={28} color="#7c3aed" />
            <div>
              <h1 className="courses-title">{data.title}</h1>
              <p className="courses-subtitle">{data.desc}</p>
            </div>
          </div>
        </div>
        <button className="add-course-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Kurslar qo'shish
        </button>
      </div>

      <div className="course-tabs">
        {branchFilters.map((branch) => (
          <button
            key={branch}
            className={`course-tab ${selectedBranch === branch ? 'active' : ''}`}
            onClick={() => setSelectedBranch(branch)}
          >
            {branch}
          </button>
        ))}
      </div>

      <div className="courses-grid">
        {filteredItems.length ? filteredItems.map((item) => (
          <div key={item.id} className="course-card" style={{ background: item.color, borderColor: item.color }}>
            <div className="course-card-header">
              <div>
                <h2 className="course-card-title">{item.name}</h2>
                <p className="course-card-desc">{item.description}</p>
              </div>
              <div className="course-card-actions">
                <button className="course-action-btn" title="O'chirish" onClick={() => deleteItem(item.id)}>
                  <Trash2 size={16} />
                </button>
                <button className="course-action-btn" title="Tahrirlash">
                  <Pencil size={16} />
                </button>
              </div>
            </div>
            <div className="course-card-tags">
              <span className="course-card-tag">{item.lessonDuration}</span>
              <span className="course-card-tag">{item.courseLength}</span>
              <span className="course-card-tag">{item.price}</span>
            </div>
          </div>
        )) : (
          <div className="empty-state">Bu filial uchun kurs topilmadi.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="student-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="student-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">Kurs qo'shish</h2>
                <p className="s-modal-subtitle">Yangi kurs ma'lumotlarini to'ldiring va saqlang.</p>
              </div>
              <button className="s-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form className="s-form" onSubmit={handleAdd}>
              <div className="s-form-group">
                <label className="s-form-label">Nomi</label>
                <input
                  type="text"
                  className="s-form-input"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="HR Manager..."
                />
              </div>

              <div className="s-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="s-form-label">Kurs mavjud bo'ladigan filial(lar)</label>
                  <button type="button" className="s-btn-cancel" style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }} onClick={selectAllBranches}>
                    Hammisini tanlash
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
                  {branchOptions.map((branch) => (
                    <label key={branch} className="s-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newItem.branches.includes(branch)}
                        onChange={() => toggleBranch(branch)}
                      />
                      {branch}
                    </label>
                  ))}
                </div>
              </div>

              <div className="s-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="s-form-label">Dars davomiyligi</label>
                  <select
                    className="s-form-input"
                    value={newItem.lessonDuration}
                    onChange={(e) => setNewItem({ ...newItem, lessonDuration: e.target.value })}
                  >
                    <option value="">Tanlang</option>
                    {lessonDurations.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="s-form-label">Kurs davomiyligi (oylarda)</label>
                  <select
                    className="s-form-input"
                    value={newItem.courseLength}
                    onChange={(e) => setNewItem({ ...newItem, courseLength: e.target.value })}
                  >
                    <option value="">Tanlang</option>
                    {courseLengths.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Narx</label>
                <input
                  type="text"
                  className="s-form-input"
                  required
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Narxini kiriting"
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Description</label>
                <textarea
                  className="s-form-textarea"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="A little about the company and the team that you'll be working with."
                />
              </div>

              <div className="s-form-group">
                <label className="s-form-label">Rangi</label>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewItem({ ...newItem, color })}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        border: newItem.color === color ? '3px solid #1e293b' : '2px solid #e2e8f0',
                        background: color,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="s-modal-actions">
                <button type="button" className="s-btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className={`s-btn-submit active`}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicSubPage
