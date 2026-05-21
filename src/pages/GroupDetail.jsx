import { useState, useEffect } from 'react'
import { getJson } from '../api'
import { Users, Gift } from 'lucide-react'

export default function GroupDetail({ groupId }) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJson(`/groups/${groupId}`)
        const data = res?.data || res
        setGroup(data)
      } catch (err) {
        console.error('Group detail load error', err)
      }
      setLoading(false)
    }
    load()
  }, [groupId])

  if (loading) return <div className="students-card">Yuklanmoqda...</div>

  if (!group) return <div className="students-card">Guruh topilmadi</div>

  return (
    <div className="group-detail-page">
      <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{group.name || group.group_name || 'Guruh'}</h1>
          <div style={{ marginTop: '8px', color: '#64748b' }}>{group.course || group.direction || ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ padding: '6px 10px', background: '#ecfdf5', color: '#065f46', borderRadius: 8, fontWeight: 700 }}>{group.status || 'Aktiv'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem', marginTop: '1rem' }}>
        <div className="students-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Guruh mentorlari</h3>
          {Array.isArray(group.teachers) && group.teachers.length > 0 ? (
            group.teachers.map((t) => (
              <div key={t.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 48, height: 48, borderRadius: 999, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.name ? t.name.split(' ').map(n => n[0]).join('') : 'T'}
                </div>
                <div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>Teacher</div>
                  <div style={{ fontWeight: 700 }}>{t.name || t.full_name}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem 0', color: '#64748b' }}>Mentorlar yo'q</div>
          )}
        </div>

        <div className="students-card" style={{ padding: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Parametrlar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kurs:</span><strong>{group.course || '—'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O'rtacha yosh:</span><strong>{group.avg_age || '-'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O'quvchilar sig'imi:</span><strong>{group.student_limit || '-'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mavjud o'quvchilar:</span><strong>{group.students ? group.students.length : (group.students_count || 0)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}
