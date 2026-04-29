import { ResaleDepartmentDto } from '../../dtos/resale-department.dto';
import { CreateResaleDepartmentInputDto } from '../../usecases/create-resale-department/dtos/create-resale-department.dto';
import { EditResaleDepartmentInputDto } from '../../usecases/edit-resale-department/dtos/edit-resale-department.dto';
import { FindAllResaleDepartmentQueryDto } from '../../usecases/find-all-resale-department/dtos/find-all-resale-department.dto';

export interface IResaleDepartmentDao {
  findAll(queries: FindAllResaleDepartmentQueryDto): Promise<[ResaleDepartmentDto[], number]>;
  findById(id: number): Promise<ResaleDepartmentDto | null>;
  findByName(name: string): Promise<ResaleDepartmentDto | null>;
  save(data: CreateResaleDepartmentInputDto): Promise<number>;
  edit(id: number, data: EditResaleDepartmentInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countContactsByDepartmentId(departmentId: number): Promise<number>;
}
