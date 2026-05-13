import React, { useState } from 'react'

const subPageData = {
  kurslar: { title: 'Kurslar', icon: '📚', desc: 'Akademiyadagi barcha mavjud kurslar ro\'yxati.' },
  xonalar: { title: 'Xonalar', icon: '🏫', desc: 'Dars xonalari va jihozlanishi.' },
  filial: { title: 'Filiallar', icon: '🏢', desc: 'O\'quv markazining filiallari.' },
  hodimlar: { title: 'Hodimlar', icon: '👥', desc: 'Akademiya hodimlari.' },
}

function DynamicSubPage({ id }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Frontend ReactJS', price: '1,200,000', duration: '6 oy', students: 45 },
    { id: 2, name: 'Python Backend', price: '1,500,000', duration: '7 oy', students: 32 },
    { id: 3, name: 'Grafik Dizayn', price: '1,000,000', duration: '4 oy', students: 28 },
  ])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', duration: '', students: 0 })

  const data = subPageData[id] || { title: 'Sahifa', icon: '📄', desc: 'Ma\'lumot topilmadi.' }

  const handleAdd = (e) => {
    e.preventDefault()
    setItems([...items, { ...newItem, id: Date.now() }])
    setIsModalOpen(false)
    setNewItem({ name: '', price: '', duration: '', students: 0 })
  }

  const deleteItem = (id) => {
    if(window.confirm('O\'chirmoqchimisiz?')) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  return (
    <div className="subpage-wrapper">
      <div className="teachers-header">
        <div className="header-content">
          <h1>{data.icon} {data.title}</h1>
          <p className="subtitle">{data.desc}</p>
        </div>
        <button className="add-teacher-btn" onClick={() => setIsModalOpen(true)}>
          <span>+</span> Yangi qo'shish
        </button>
      </div>

      <div className="teachers-card">
        <table className="teachers-table">
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Narxi (so'm)</th>
              <th>Davomiyligi</th>
              <th>Talabalar</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td><strong style={{color: 'var(--text)'}}>{item.name}</strong></td>
                <td>{item.price}</td>
                <td><span className="pill-badge">{item.duration}</span></td>
                <td>{item.students} ta</td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn edit">✏️</button>
                    <button className="icon-btn delete" onClick={() => deleteItem(item.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Yangi Ma'lumot</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="form-row">
                <label>Nomi</label>
                <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="form-row">
                <label>Narxi</label>
                <input type="text" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <div className="form-row">
                <label>Davomiyligi</label>
                <input type="text" required value={newItem.duration} onChange={e => setNewItem({...newItem, duration: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="btn-submit">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DynamicSubPage
