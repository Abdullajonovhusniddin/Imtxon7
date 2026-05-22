import { useState, useEffect } from 'react'
import { deleteJson, getJson, patchJson, postJson } from '../api'
import { 
  BookOpen, 
  Home, 
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

const COURSES_API = 'https://najot-edu.softwareengineer.uz/api/v1/courses'
const COURSES_ARCHIVE_API = 'https://najot-edu.softwareengineer.uz/api/v1/courses/archive'
const COURSE_ONE_API = 'https://najot-edu.softwareengineer.uz/api/v1/courses/one'

const mapCourse = (course, fallback = {}) => ({
  ...fallback,
  ...course,
  id: course?.id ?? course?.course_id ?? course?._id ?? fallback.id,
  uiId: course?.id ?? course?.course_id ?? course?._id ?? fallback.uiId ?? Date.now(),
  name: course?.name || course?.title || fallback.name || "Noma'lum kurs",
  branch: course?.branch || course?.filial || fallback.branch || 'Filial 1',
  description: course?.description || fallback.description || 'Kurs haqida ma\'lumot.',
  lessonDuration: course?.duration_hours ? `${course.duration_hours} soat` : course?.lesson_duration || course?.lessonDuration || fallback.lessonDuration || '0 soat',
  courseLength: course?.duration_month ? `${course.duration_month} oy` : course?.course_length || course?.courseLength || fallback.courseLength || '0 oy',
  durationMonth: course?.duration_month ?? fallback.durationMonth ?? 0,
  durationHours: course?.duration_hours ?? fallback.durationHours ?? 0,
  price: course?.price ? String(course.price) : fallback.price || '0',
  color: course?.color || fallback.color || '#eff6ff',
})

function DynamicSubPage({ id }) {
  const [items, setItems] = useState([])

  const branchFilters = ['Filial 1', 'Filial 2', 'Arxiv']
  const [selectedBranch, setSelectedBranch] = useState('Filial 1')

  const branchOptions = ['Filial 1', 'Filial 2', 'Filial 3']
  const colorOptions = ['#111827', '#7c3aed', '#dc2626', '#ea580c', '#15803d', '#0ea5e9', '#9333ea', '#f43f5e']

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    branches: [],
    durationMonth: '',
    durationHours: '',
    price: '',
    description: '',
    color: '#7c3aed',
    students: 0,
  })

  // Load courses from API
  const loadCourses = async (archive = selectedBranch === 'Arxiv') => {
    if (id !== 'kurslar') return

    try {
      const res = await getJson(archive ? COURSES_ARCHIVE_API : COURSES_API)
      const data = res?.data || res
      setItems(Array.isArray(data) ? data.map(c => mapCourse(c, { branch: archive ? 'Arxiv' : 'Filial 1' })) : [])
    } catch (err) {
      console.error('Courses API Error:', err)
      setItems([])
    }
  }

  useEffect(() => {
    queueMicrotask(() => loadCourses(false))
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

  const getCourseId = (course) => course?.id ?? course?.course_id ?? course?._id

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch)
    if (id === 'kurslar') {
      loadCourses(branch === 'Arxiv')
    }
  }

  const resetCourseForm = () => {
    setEditingItem(null)
    setNewItem({ name: '', branches: [], durationMonth: '', durationHours: '', price: '', description: '', color: '#7c3aed', students: 0 })
  }

  const fillCourseForm = (course) => {
    const mapped = mapCourse(course)
    setEditingItem(mapped)
    setNewItem({
      name: mapped.name || '',
      branches: mapped.branch && mapped.branch !== 'Arxiv' ? [mapped.branch] : [],
      durationMonth: mapped.durationMonth ? String(mapped.durationMonth) : '',
      durationHours: mapped.durationHours ? String(mapped.durationHours) : '',
      price: mapped.price || '',
      description: mapped.description || '',
      color: mapped.color || '#7c3aed',
      students: mapped.students || 0,
    })
  }

  const openCreateModal = () => {
    resetCourseForm()
    setIsModalOpen(true)
  }

  const openEditModal = async (course) => {
    const courseId = getCourseId(course)
    if (!courseId) {
      alert("Kurs ID topilmadi. Tahrirlash uchun API'dan id, course_id yoki _id kelishi kerak.")
      return
    }

    fillCourseForm(course)
    setIsModalOpen(true)

    try {
      const response = await getJson(`${COURSE_ONE_API}/${courseId}`)
      const data = response?.data || response
      fillCourseForm({ ...course, ...data })
    } catch (err) {
      console.error('Course detail API Error:', err)
      alert(err.message || "Kurs ma'lumotlarini yuklashda xatolik yuz berdi.")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetCourseForm()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    const localItem = {
      ...newItem,
      uiId: Date.now(),
      branch: newItem.branches[0] || 'Filial 1',
      color: newItem.color,
      description: newItem.description || 'Kurs haqida ma\'lumot.',
      lessonDuration: `${Number(newItem.durationHours) || 0} soat`,
      courseLength: `${Number(newItem.durationMonth) || 0} oy`,
      durationMonth: Number(newItem.durationMonth) || 0,
      durationHours: Number(newItem.durationHours) || 0,
    }

    if (id === 'kurslar') {
      try {
        const payload = {
          name: newItem.name,
          description: newItem.description,
          price: Number(newItem.price) || 0,
          duration_month: Number(newItem.durationMonth) || 0,
          duration_hours: Number(newItem.durationHours) || 0,
        }
        if (editingItem) {
          const editingId = getCourseId(editingItem)
          if (!editingId) {
            alert("Kurs ID topilmadi. Tahrirlash uchun API'dan id, course_id yoki _id kelishi kerak.")
            setSaving(false)
            return
          }

          const updated = await patchJson(`${COURSES_API}/${editingId}`, payload)
          const updatedItem = updated?.data || updated
          setItems(prev => prev.map(item =>
            String(getCourseId(item)) === String(editingId) ? mapCourse(updatedItem, { ...editingItem, ...localItem }) : item
          ))
        } else {
          const created = await postJson(COURSES_API, payload)
          const createdItem = created?.data || created
          setItems(prev => [...prev, mapCourse(createdItem, localItem)])
        }
      } catch (err) {
        console.error('Course create error:', err)
        alert(err.message || "Kurs qo'shishda xatolik yuz berdi.")
        setSaving(false)
        return
      }
    } else {
      setItems(prev => [...prev, localItem])
    }

    closeModal()
    setSaving(false)
  }

  const deleteItem = async (itemId) => {
    if (!window.confirm("O'chirmoqchimisiz?")) return
    if (!itemId) {
      alert("Kurs ID topilmadi. API'dan id, course_id yoki _id kelayotganini tekshiring.")
      return
    }

    try {
      if (id === 'kurslar') {
        await deleteJson(`${COURSES_API}/${itemId}`)
      }
      setItems(prev => prev.filter(i => String(getCourseId(i)) !== String(itemId)))
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.message || "O'chirishda xatolik yuz berdi.")
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
        <button className="add-course-btn" onClick={openCreateModal}>
          <Plus size={18} />
          Kurslar qo'shish
        </button>
      </div>

      <div className="course-tabs">
        {branchFilters.map((branch) => (
          <button
            key={branch}
            className={`course-tab ${selectedBranch === branch ? 'active' : ''}`}
            onClick={() => handleBranchChange(branch)}
          >
            {branch}
          </button>
        ))}
      </div>

      <div className="courses-grid">
        {filteredItems.length ? filteredItems.map((item) => (
          <div key={item.id || item.uiId} className="course-card" style={{ background: item.color, borderColor: item.color }}>
            <div className="course-card-header">
              <div>
                <h2 className="course-card-title">{item.name}</h2>
                <p className="course-card-desc">{item.description}</p>
              </div>
              <div className="course-card-actions">
                <button className="course-action-btn" title="O'chirish" onClick={() => deleteItem(getCourseId(item))}>
                  <Trash2 size={16} />
                </button>
                <button className="course-action-btn" title="Tahrirlash" onClick={() => openEditModal(item)}>
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
        <div className="student-modal-overlay" onClick={closeModal}>
          <div className="student-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="s-modal-header">
              <div>
                <h2 className="s-modal-title">{editingItem ? 'Kursni tahrirlash' : "Kurs qo'shish"}</h2>
                <p className="s-modal-subtitle">Kurs ma'lumotlarini to'ldiring va saqlang.</p>
              </div>
              <button className="s-modal-close" onClick={closeModal}>
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
                  <input
                    type="number"
                    className="s-form-input"
                    min="0"
                    value={newItem.durationHours}
                    onChange={(e) => setNewItem({ ...newItem, durationHours: e.target.value })}
                    placeholder="Masalan: 120"
                  />
                </div>
                <div>
                  <label className="s-form-label">Kurs davomiyligi (oylarda)</label>
                  <input
                    type="number"
                    className="s-form-input"
                    min="0"
                    value={newItem.durationMonth}
                    onChange={(e) => setNewItem({ ...newItem, durationMonth: e.target.value })}
                    placeholder="Masalan: 6"
                  />
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
                <button type="button" className="s-btn-cancel" onClick={closeModal}>Bekor qilish</button>
                <button type="submit" className={`s-btn-submit active`} disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicSubPage

