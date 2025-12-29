import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ServicesSection({ salonId, services, setServices }) {
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('')

  const handleCreateService = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase
      .from('services')
      .insert([{ salon_id: salonId, name: serviceName, duration_minutes: Number(serviceDuration) }])
      .select()
      .single()
    if (error) console.error(error)
    else setServices(prev => [...prev, data])
    setServiceName('')
    setServiceDuration('')
  }

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (error) console.error(error)
    else setServices(prev => prev.filter(s => s.id !== serviceId))
  }

  return (
    <section>
      <h2>Serviços</h2>
      <form onSubmit={handleCreateService} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Nome do serviço"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Duração (min)"
          value={serviceDuration}
          onChange={(e) => setServiceDuration(e.target.value)}
          required
        />
        <button type="submit">Adicionar serviço</button>
      </form>
      {services.length === 0 ? <p>Nenhum serviço cadastrado.</p> : (
        <ul>
          {services.map(service => (
            <li key={service.id}>
              {service.name} — {service.duration_minutes} min
              <button
                style={{ marginLeft: '10px', color: 'red' }}
                onClick={() => handleDeleteService(service.id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
