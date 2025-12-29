import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import ProfessionalCalendar from './ProfessionalCalendar'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfessionalsSection({
  professionals,
  services,
  slotsByProfessional,
  setSlotsByProfessional
}) {
  const [slotTime, setSlotTime] = useState('')
  const [slotServiceId, setSlotServiceId] = useState('')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('')

  const handleCreateSlot = async (e) => {
    e.preventDefault()
    if (!selectedProfessionalId || !slotServiceId) return

    const { data, error } = await supabase
      .from('slots')
      .insert([{ professional_id: selectedProfessionalId, time: slotTime, service_id: slotServiceId }])
      .select('*, services(name)')
      .single()
    if (error) console.error(error)
    else setSlotsByProfessional(prev => ({
      ...prev,
      [selectedProfessionalId]: [...prev[selectedProfessionalId], data]
    }))
    setSlotTime('')
    setSlotServiceId('')
  }

  const handleDeleteSlot = async (slotId, professionalId) => {
    if (!window.confirm('Remover este horário?')) return
    const { error } = await supabase.from('slots').delete().eq('id', slotId)
    if (error) console.error(error)
    else setSlotsByProfessional(prev => ({
      ...prev,
      [professionalId]: prev[professionalId].filter(s => s.id !== slotId)
    }))
  }

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    const fromProId = source.droppableId
    const toProId = destination.droppableId
    if (fromProId === toProId && source.index === destination.index) return

    const slot = slotsByProfessional[fromProId].find(s => s.id === draggableId)
    if (fromProId !== toProId) {
      const { error } = await supabase
        .from('slots')
        .update({ professional_id: toProId })
        .eq('id', draggableId)
      if (error) return console.error(error)
    }

    const newSlots = { ...slotsByProfessional }
    newSlots[fromProId] = Array.from(newSlots[fromProId])
    newSlots[fromProId].splice(source.index, 1)
    newSlots[toProId] = Array.from(newSlots[toProId])
    newSlots[toProId].splice(destination.index, 0, slot)
    setSlotsByProfessional(newSlots)
  }

  return (
    <section>
      <h2>Profissionais</h2>
      {professionals.length === 0 ? <p>Nenhum profissional cadastrado.</p> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {professionals.map(pro => (
              <Droppable droppableId={pro.id} key={pro.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ border: '1px solid #ccc', padding: '10px', minWidth: '250px', borderRadius: '8px' }}
                  >
                    <h3>{pro.name}</h3>
                    <form onSubmit={handleCreateSlot} style={{ marginBottom: '10px' }}>
                      <input
                        type="datetime-local"
                        value={slotTime}
                        onChange={(e) => setSlotTime(e.target.value)}
                        required
                      />
                      <select
                        value={slotServiceId}
                        onChange={(e) => setSlotServiceId(e.target.value)}
                        required
                      >
                        <option value="">Serviço</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button type="submit" onClick={() => setSelectedProfessionalId(pro.id)}>Adicionar</button>
                    </form>
                    <ProfessionalCalendar
                      slots={slotsByProfessional[pro.id] || []}
                      professionalId={pro.id}
                      handleDeleteSlot={handleDeleteSlot}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </section>
  )
}
