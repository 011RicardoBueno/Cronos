import React from 'react';
import ProfessionalCalendar from './ProfessionalCalendar';

const ProfessionalsSection = ({ 
  professionals, 
  selectedProfessionalId, 
  slotsByProfessional, 
  handleDeleteSlot, 
  handleMoveSlot,
  colors 
}) => {
  
  // Filtra os profissionais que devem aparecer
  const filteredProfessionals = professionals.filter(pro => 
    selectedProfessionalId === "all" || pro.id === selectedProfessionalId
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {filteredProfessionals.map(pro => (
        <div key={pro.id} style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
        }}>
          <h3 style={{ color: colors.deepCharcoal, marginBottom: '15px' }}>
            Agenda: {pro.name}
          </h3>
          
          <ProfessionalCalendar
            // GARANTIA: Se o mapa estiver vazio para esse ID, envia um array vazio
            slots={slotsByProfessional[pro.id] || []} 
            professionalId={pro.id}
            handleDeleteSlot={handleDeleteSlot}
            handleMoveSlot={handleMoveSlot}
          />
        </div>
      ))}
      
      {filteredProfessionals.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>
          Nenhum profissional encontrado.
        </p>
      )}
    </div>
  );
};

export default ProfessionalsSection;