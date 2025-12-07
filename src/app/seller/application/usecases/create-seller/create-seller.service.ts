import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { Password } from 'src/shared/value-objects/password/password.vo';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSellerInputDto, CreateSellerOutputDto } from './dtos/create-seller.dto';

@Injectable()
export class CreateSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly uploadFileService: UploadSingle,
  ) {}

  public async execute(data: CreateSellerInputDto, image?: Express.Multer.File): Promise<CreateSellerOutputDto> {
    const duplicateEmail = await this.sellerDao.findByEmail(data.email);
    if (duplicateEmail) {
      throw new SellerDuplicateEmailError();
    }

    // Verify if each company exists
    await Promise.all(
      data.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );

    let avatarUrl: string | null = null;
    if (image) {
      const imageUploaded = await this.uploadFileService.execute(image, 'sellers/avatars');
      avatarUrl = imageUploaded.url;
    }

    // Generate random password and hash it
    const seller = Seller.create({ ...data, avatarUrl });
    const hashedPassword = new Password(data.password).value;

    await this.sellerRepository.save(seller, hashedPassword);

    return { id: seller.props.id };
  }
}
