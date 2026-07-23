export interface MonitoringConnection {
  id: string;
  name: string;
  type: 'prometheus' | 'uptime-kuma';
  url: string;
  authType: 'none' | 'basic' | 'bearer';
  authCredentials?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Representación para el frontend (con las credenciales desenmascaradas/enmascaradas)
export interface ConnectionDTO extends MonitoringConnection {}
