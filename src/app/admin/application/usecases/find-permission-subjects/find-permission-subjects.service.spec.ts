import { Test } from '@nestjs/testing';
import { PermissionSubjectCatalogVo } from 'src/app/admin/domain/value-objects/admin-subject-catalog/permission-subject-catalog.vo';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { FindPermissionSubjects } from './find-permission-subjects.service';

describe('FindPermissionSubjects - Unit tests', () => {
  let sut: FindPermissionSubjects;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [FindPermissionSubjects],
    }).compile();

    sut = module.get(FindPermissionSubjects);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return catalog from PermissionSubjectCatalogVo.entries', () => {
    // Arrange
    const expected = PermissionSubjectCatalogVo.entries();

    // Act
    const result = sut.execute();

    // Assert
    expect(result).toEqual(expected);
  });

  it('should return items with subject and non-empty label', () => {
    // Arrange / Act
    const result = sut.execute();

    // Assert
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toEqual(
        expect.objectContaining({
          subject: expect.any(String),
          label: expect.any(String),
        }),
      );
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('should return one entry per ClaimSubject without args', () => {
    // Arrange / Act
    const result = sut.execute();

    // Assert
    expect(result).toHaveLength(Object.values(ClaimSubject).length);
  });
});
