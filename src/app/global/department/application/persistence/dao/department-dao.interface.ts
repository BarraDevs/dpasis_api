import { DepartmentDto } from '../../dtos/department.dto';
import { CreateDepartmentInputDto } from '../../usecases/create-department/dtos/create-department.dto';
import { EditDepartmentInputDto } from '../../usecases/edit-department/dtos/edit-department.dto';
import { FindAllDepartmentQueryDto } from '../../usecases/find-all-department/dtos/find-all-department.dto';

export interface IDepartmentDao {
  findAll(queries: FindAllDepartmentQueryDto): Promise<[DepartmentDto[], number]>;
  findById(id: number): Promise<DepartmentDto | null>;
  findByName(name: string): Promise<DepartmentDto | null>;
  save(data: CreateDepartmentInputDto): Promise<number>;
  edit(id: number, data: EditDepartmentInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countClientContactsByDepartmentId(departmentId: number): Promise<number>;
  countResaleContactsByDepartmentId(departmentId: number): Promise<number>;
}
