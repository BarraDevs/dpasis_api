export class ClientTypeDto {
  id: number;
  clientId: number;
  quantity: number;
  active: boolean;
  clientAttendanceType: {
    id: number;
    name: string;
  };
  clientMaintenanceTicketType: {
    id: number;
    name: string;
  };
  clientSystemType: {
    id: number;
    name: string;
  };
  clientDescriptionType: {
    id: number;
    name: string;
  };
  clientDriveType: {
    id: number;
    name: string;
  };
  clientAddress: {
    id: number;
    type: string;
    city: string;
    state: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
