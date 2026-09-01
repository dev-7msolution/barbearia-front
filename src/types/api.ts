export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentMethod = "CASH" | "CARD" | "PIX";
export type PaymentStatus = "PAID" | "REFUNDED";

export type Company = {
  id: string;
  name: string;
  cnpj?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  companies: Company[];
};

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
};

export type CompanySettings = {
  companyId: string;
  cancellationMinNoticeMinutes: number;
};

export type Service = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: string;
  durationMinutes: number;
  active: boolean;
};

export type ProfessionalService = {
  id: string;
  name: string;
};

export type Professional = {
  id: string;
  name: string;
  cpf: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  services: ProfessionalService[];
};

export type ShopClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  active?: boolean;
};

export type Availability = {
  id: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export type SlotsResponse = {
  durationMinutes: number;
  slots: string[];
};

export type AppointmentService = {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceName: string;
  price: string;
  durationMinutes: number;
  commissionRate: string | null;
  commissionAmount: string | null;
  commissionPayoutId: string | null;
};

export type Appointment = {
  id: string;
  companyId: string;
  professionalId: string;
  clientId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  services: AppointmentService[];
  company?: Pick<Company, "id" | "name">;
  professional?: Pick<Professional, "id" | "name">;
  client?: Pick<ShopClient, "id" | "name">;
  payment?: Payment | null;
};

export type ClientAppointment = Appointment & {
  company: Pick<Company, "id" | "name">;
};

export type CommissionItem = {
  id: string;
  appointmentId: string;
  startAt: string;
  serviceName: string;
  price: string;
  commissionRate: string;
  commissionAmount: string;
  paid: boolean;
};

export type CommissionsResponse = {
  professionalId: string;
  from: string;
  to: string;
  total: number;
  items: CommissionItem[];
};

export type CommissionPayout = {
  id: string;
  companyId: string;
  professionalId: string;
  periodFrom: string;
  periodTo: string;
  amount: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  appointmentId: string;
  companyId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentsReport = {
  from: string;
  to: string;
  total: number;
  byMethod: Partial<Record<PaymentMethod, number>>;
  payments: Payment[];
};

export type OverviewReport = {
  from: string;
  to: string;
  appointments: {
    total: number;
    byStatus: Partial<Record<AppointmentStatus, number>>;
    cancellationRate: number;
    noShowRate: number;
  };
  revenue: {
    total: number;
    byMethod: Partial<Record<PaymentMethod, number>>;
    averageTicket: number;
  };
  topServices: {
    serviceId: string;
    name: string;
    count: number;
    revenue: number;
  }[];
  topProfessionals: {
    professionalId: string;
    name: string;
    appointmentsCompleted: number;
    revenue: number;
    commission: number;
  }[];
  topClients: {
    clientId: string;
    name: string;
    visits: number;
    revenue: number;
  }[];
  clients: { new: number; returning: number };
};
