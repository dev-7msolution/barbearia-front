import { api } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentStatus,
  Availability,
  ClientAppointment,
  ClientUser,
  CommissionPayout,
  CommissionsResponse,
  Company,
  CompanySettings,
  OverviewReport,
  Payment,
  PaymentMethod,
  PaymentsReport,
  Professional,
  Service,
  ShopClient,
  SlotsResponse,
  StaffUser,
} from "@/types/api";

export const barbearia = {
  auth: {
    loginStaff: (body: { email: string; password: string }) =>
      api.post<{ token: string; user: StaffUser }>("/auth/login", body).then((r) => r.data),
    loginClient: (body: { email: string; password: string }) =>
      api
        .post<{ token: string; client: ClientUser }>("/clients/login", body)
        .then((r) => r.data),
    registerClient: (body: {
      name: string;
      email: string;
      password: string;
      cpf?: string;
      phone?: string;
    }) => api.post<ClientUser>("/clients/register", body).then((r) => r.data),
    createUser: (body: {
      name: string;
      email: string;
      password: string;
      companyIds: string[];
    }) => api.post<StaffUser>("/users", body).then((r) => r.data),
  },

  companies: {
    create: (body: { name: string; cnpj: string }) =>
      api.post<Company>("/companies", body).then((r) => r.data),
    list: () => api.get<Company[]>("/companies").then((r) => r.data),
    get: (id: string) => api.get<Company>(`/companies/${id}`).then((r) => r.data),
    update: (id: string, body: { name?: string; active?: boolean }) =>
      api.patch<Company>(`/companies/${id}`, body).then((r) => r.data),
    settings: (companyId: string) =>
      api
        .get<CompanySettings>(`/companies/${companyId}/settings`)
        .then((r) => r.data),
    updateSettings: (
      companyId: string,
      body: { cancellationMinNoticeMinutes: number },
    ) =>
      api
        .patch<CompanySettings>(`/companies/${companyId}/settings`, body)
        .then((r) => r.data),
  },

  services: {
    list: (companyId: string) =>
      api.get<Service[]>(`/companies/${companyId}/services`).then((r) => r.data),
    create: (
      companyId: string,
      body: {
        name: string;
        description?: string;
        price: number;
        durationMinutes: number;
      },
    ) =>
      api
        .post<Service>(`/companies/${companyId}/services`, body)
        .then((r) => r.data),
    update: (
      companyId: string,
      id: string,
      body: Partial<{
        name: string;
        description: string;
        price: number;
        durationMinutes: number;
        active: boolean;
      }>,
    ) =>
      api
        .patch<Service>(`/companies/${companyId}/services/${id}`, body)
        .then((r) => r.data),
    remove: (companyId: string, id: string) =>
      api.delete(`/companies/${companyId}/services/${id}`),
  },

  professionals: {
    list: (companyId: string) =>
      api
        .get<Professional[]>(`/companies/${companyId}/professionals`)
        .then((r) => r.data),
    get: (companyId: string, id: string) =>
      api
        .get<Professional>(`/companies/${companyId}/professionals/${id}`)
        .then((r) => r.data),
    create: (
      companyId: string,
      body: {
        name: string;
        cpf: string;
        phone?: string;
        email?: string;
        serviceIds?: string[];
      },
    ) =>
      api
        .post<Professional>(`/companies/${companyId}/professionals`, body)
        .then((r) => r.data),
    update: (
      companyId: string,
      id: string,
      body: Partial<{
        name: string;
        phone: string;
        email: string;
        serviceIds: string[];
      }>,
    ) =>
      api
        .patch<Professional>(`/companies/${companyId}/professionals/${id}`, body)
        .then((r) => r.data),
    remove: (companyId: string, id: string) =>
      api.delete(`/companies/${companyId}/professionals/${id}`),
    availability: (companyId: string, professionalId: string) =>
      api
        .get<Availability[]>(
          `/companies/${companyId}/professionals/${professionalId}/availability`,
        )
        .then((r) => r.data),
    addAvailability: (
      companyId: string,
      professionalId: string,
      body: { weekday: number; startMinute: number; endMinute: number },
    ) =>
      api
        .post<Availability>(
          `/companies/${companyId}/professionals/${professionalId}/availability`,
          body,
        )
        .then((r) => r.data),
    removeAvailability: (
      companyId: string,
      professionalId: string,
      id: string,
    ) =>
      api.delete(
        `/companies/${companyId}/professionals/${professionalId}/availability/${id}`,
      ),
    slots: (
      companyId: string,
      professionalId: string,
      params: {
        date: string;
        serviceIds: string[];
        excludeAppointmentId?: string;
      },
    ) =>
      api
        .get<SlotsResponse>(
          `/companies/${companyId}/professionals/${professionalId}/slots`,
          {
            params: {
              date: params.date,
              serviceIds: params.serviceIds.join(","),
              excludeAppointmentId: params.excludeAppointmentId,
            },
          },
        )
        .then((r) => r.data),
    setCommission: (companyId: string, id: string, rate: number) =>
      api.patch(`/companies/${companyId}/professionals/${id}/commission`, {
        rate,
      }),
    setServiceCommission: (
      companyId: string,
      id: string,
      serviceId: string,
      rate: number,
    ) =>
      api.patch(
        `/companies/${companyId}/professionals/${id}/services/${serviceId}/commission`,
        { rate },
      ),
    commissions: (
      companyId: string,
      id: string,
      params: { from: string; to: string },
    ) =>
      api
        .get<CommissionsResponse>(
          `/companies/${companyId}/professionals/${id}/commissions`,
          { params },
        )
        .then((r) => r.data),
    payout: (
      companyId: string,
      id: string,
      body: { from: string; to: string },
    ) =>
      api
        .post<CommissionPayout>(
          `/companies/${companyId}/professionals/${id}/commission/payouts`,
          body,
        )
        .then((r) => r.data),
    payouts: (companyId: string, id: string) =>
      api
        .get<CommissionPayout[]>(
          `/companies/${companyId}/professionals/${id}/commission/payouts`,
        )
        .then((r) => r.data),
  },

  clients: {
    list: (companyId: string) =>
      api
        .get<ShopClient[]>(`/companies/${companyId}/clients`)
        .then((r) => r.data),
    create: (
      companyId: string,
      body: { name: string; phone?: string; cpf?: string; email?: string },
    ) =>
      api
        .post<ShopClient>(`/companies/${companyId}/clients`, body)
        .then((r) => r.data),
    update: (
      companyId: string,
      id: string,
      body: Partial<{ name: string; phone: string; email: string }>,
    ) =>
      api
        .patch<ShopClient>(`/companies/${companyId}/clients/${id}`, body)
        .then((r) => r.data),
    remove: (companyId: string, id: string) =>
      api.delete(`/companies/${companyId}/clients/${id}`),
  },

  appointments: {
    list: (
      companyId: string,
      params?: { professionalId?: string; date?: string },
    ) =>
      api
        .get<Appointment[]>(`/companies/${companyId}/appointments`, { params })
        .then((r) => r.data),
    get: (companyId: string, id: string) =>
      api
        .get<Appointment>(`/companies/${companyId}/appointments/${id}`)
        .then((r) => r.data),
    createStaff: (
      companyId: string,
      body: {
        professionalId: string;
        clientId: string;
        serviceIds: string[];
        startAt: string;
        notes?: string;
      },
    ) =>
      api
        .post<Appointment>(`/companies/${companyId}/appointments`, body)
        .then((r) => r.data),
    updateStatus: (
      companyId: string,
      id: string,
      status: Exclude<AppointmentStatus, "SCHEDULED">,
    ) =>
      api
        .patch<Appointment>(
          `/companies/${companyId}/appointments/${id}/status`,
          { status },
        )
        .then((r) => r.data),
    reschedule: (
      companyId: string,
      id: string,
      body: { startAt: string; professionalId?: string; notes?: string },
    ) =>
      api
        .patch<Appointment>(
          `/companies/${companyId}/appointments/${id}/schedule`,
          body,
        )
        .then((r) => r.data),
    createMine: (body: {
      companyId: string;
      professionalId: string;
      serviceIds: string[];
      startAt: string;
      notes?: string;
    }) =>
      api.post<Appointment>("/clients/me/appointments", body).then((r) => r.data),
    listMine: () =>
      api.get<ClientAppointment[]>("/clients/me/appointments").then((r) => r.data),
    cancelMine: (id: string) =>
      api.patch(`/clients/me/appointments/${id}/cancel`).then((r) => r.data),
  },

  payments: {
    create: (
      companyId: string,
      appointmentId: string,
      body: { method: PaymentMethod; amount?: number },
    ) =>
      api
        .post<Payment>(
          `/companies/${companyId}/appointments/${appointmentId}/payment`,
          body,
        )
        .then((r) => r.data),
    get: (companyId: string, appointmentId: string) =>
      api
        .get<Payment>(
          `/companies/${companyId}/appointments/${appointmentId}/payment`,
        )
        .then((r) => r.data),
    refund: (companyId: string, appointmentId: string) =>
      api
        .patch<Payment>(
          `/companies/${companyId}/appointments/${appointmentId}/payment/refund`,
        )
        .then((r) => r.data),
    report: (companyId: string, params: { from: string; to: string }) =>
      api
        .get<PaymentsReport>(`/companies/${companyId}/payments`, { params })
        .then((r) => r.data),
  },

  reports: {
    overview: (companyId: string, params: { from: string; to: string }) =>
      api
        .get<OverviewReport>(`/companies/${companyId}/reports/overview`, {
          params,
        })
        .then((r) => r.data),
  },
};
