export interface Port {
  id: string;
  port_name: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  un_locode: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePortInput {
  port_name: string;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  un_locode?: string | null;
  remarks?: string | null;
}

export interface UpdatePortInput {
  port_name?: string;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  un_locode?: string | null;
  remarks?: string | null;
}
