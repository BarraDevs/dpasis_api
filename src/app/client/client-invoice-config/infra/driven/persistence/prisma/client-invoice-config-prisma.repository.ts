import { Injectable } from '@nestjs/common';
import { ClientInvoiceConfig } from 'src/app/client/client-invoice-config/domain/entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { IClientInvoiceConfigRepository } from 'src/app/client/client-invoice-config/application/persistence/repository/client-invoice-config-repository.interface';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';

@Injectable()
export class ClientInvoiceConfigRepositoryAdapterPrisma implements IClientInvoiceConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async save(entity: ClientInvoiceConfig): Promise<number> {
    const result = await this.prisma.clientInvoiceConfig.create({
      data: {
        clientId: entity.props.clientId,
        generateNf: entity.props.generateNf,
        type: entity.props.type,
        emissionDay: entity.props.emissionDay,
        dueDateType: entity.props.dueDateType,
        dueDateDay: entity.props.dueDateDay,
        deadlineDays: entity.props.deadlineDays,
        months: entity.props.months,
        billingAddressId: entity.props.billingAddressId,
        bankId: entity.props.bankId,
        autoProtestBoleto: entity.props.autoProtestBoleto,
        message: entity.props.message,
      },
    });

    return result.id;
  }

  public async edit(entity: ClientInvoiceConfig): Promise<void> {
    await this.prisma.clientInvoiceConfig.update({
      where: { id: entity.props.id! },
      data: {
        clientId: entity.props.clientId,
        generateNf: entity.props.generateNf,
        type: entity.props.type,
        emissionDay: entity.props.emissionDay,
        dueDateType: entity.props.dueDateType,
        dueDateDay: entity.props.dueDateDay,
        deadlineDays: entity.props.deadlineDays,
        months: entity.props.months,
        billingAddressId: entity.props.billingAddressId,
        bankId: entity.props.bankId,
        autoProtestBoleto: entity.props.autoProtestBoleto,
        message: entity.props.message,
      },
    });
  }

  public async findById(id: number): Promise<ClientInvoiceConfig | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { id },
    });
    if (!data) return null;

    return ClientInvoiceConfigFactory.load({
      id: data.id,
      clientId: data.clientId,
      generateNf: data.generateNf,
      type: data.type as ClientInvoiceConfigType,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
      dueDateDay: data.dueDateDay,
      deadlineDays: data.deadlineDays,
      months: data.months,
      billingAddressId: data.billingAddressId,
      bankId: data.bankId,
      autoProtestBoleto: data.autoProtestBoleto,
      message: data.message,
    });
  }

  public async findByClientId(clientId: number): Promise<ClientInvoiceConfig | null> {
    const data = await this.prisma.clientInvoiceConfig.findUnique({
      where: { clientId },
    });
    if (!data) return null;

    return ClientInvoiceConfigFactory.load({
      id: data.id,
      clientId: data.clientId,
      generateNf: data.generateNf,
      type: data.type as ClientInvoiceConfigType,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType as ClientInvoiceConfigDueDateType,
      dueDateDay: data.dueDateDay,
      deadlineDays: data.deadlineDays,
      months: data.months,
      billingAddressId: data.billingAddressId,
      bankId: data.bankId,
      autoProtestBoleto: data.autoProtestBoleto,
      message: data.message,
    });
  }

  public async delete(id: number): Promise<void> {
    await this.prisma.clientInvoiceConfig.delete({
      where: { id },
    });
  }
}
