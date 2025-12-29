// types/dashboard.ts
export interface Salon {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  salon_id: string;
  created_at: string;
}

export interface Professional {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  salon_id: string;
  created_at: string;
}

export interface Slot {
  id: string;
  time: string;
  professional_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  services?: {
    name: string;
  };
}

export interface SlotsByProfessional {
  [professionalId: string]: Slot[];
}

export interface DashboardState {
  salon: Salon | null;
  services: Service[];
  professionals: Professional[];
  slotsByProfessional: SlotsByProfessional;
  loading: boolean;
  error: string | null;
  selectedProfessionalId: string;
}

export interface DashboardProps {
  session: {
    user: {
      id: string;
      email?: string;
    };
  };
}
