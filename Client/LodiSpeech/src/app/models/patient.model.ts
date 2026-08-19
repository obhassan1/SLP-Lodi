export interface User {
    _id: string;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'therapist';
    active: boolean;
    canManageLocation?: boolean;
    canTreatPatients?: boolean;
}
export interface SessionNote {
    _id?: string;
    appointment?: string;
    sessionDate: string;
    focus: string;
    note: string;
    paid: boolean;
    amount: number;
    therapist?: string | User;
    therapistName?: string;
}
export interface Caregiver {
    name: string;
    relationship: string;
    phone: string;
    email: string;
}
export interface Patient {
    _id?: string;
    name: string;
    dateOfBirth: string;
    caregivers: Caregiver[];
    contact: {
        phone: string;
        email: string;
        address?: string;
    };
    therapyFocus: string;
    notes: SessionNote[];
    assignedTherapists?: User[] | string[];
    active?: boolean;
}
export interface Appointment {
    _id?: string;
    patient: string | Patient;
    therapist?: string | User;
    startsAt: string;
    durationMinutes: number;
    location?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    paid: boolean;
    amount: number;
    note?: string;
}
