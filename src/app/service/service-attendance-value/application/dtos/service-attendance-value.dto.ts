export class ServiceAttendanceValueDto {
  id: number;
  serviceId: number;
  values: Record<string, number>;
  totalValueInCents: number;
  createdAt: Date;
  updatedAt: Date;
}
