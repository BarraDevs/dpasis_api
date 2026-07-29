export class ClientTypeDto {
  id: number;
  clientId: number;
  quantity: number;
  active: boolean;
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
    cityCodeIbge: string | null;
    state: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
