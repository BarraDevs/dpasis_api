/**
 * Caminhos dos templates Handlebars.
 * Centraliza as referências para facilitar manutenção.
 */
const APP = 'application';
const PERSISTENCE = `${APP}/persistence`;
const USECASES = `${APP}/usecases`;

const INFRA = 'infra';
const CONTROLLER = `${INFRA}/controller`;
const DAO = `${INFRA}/dao`;
const REPOSITORY = `${INFRA}/repository`;

const DOMAIN = 'domain';
const ENUMS = `${DOMAIN}/enums`;
const ERRORS = `${DOMAIN}/errors`;

const MODULE = 'module';

export const TEMPLATES = {
  // Application
  application: {
    dto: `${APP}/dto/dto.hbs`,
    persistence: {
      module: `${PERSISTENCE}/persistence-module.hbs`,
      moduleDdd: `${PERSISTENCE}/persistence-module-ddd.hbs`,
      daoInterface: `${PERSISTENCE}/dao-interface.hbs`,
      daoInterfaceDdd: `${PERSISTENCE}/dao-interface-ddd.hbs`,
      repositoryInterface: `${PERSISTENCE}/repository-interface.hbs`,
    },
    usecases: {
      create: {
        service: `${USECASES}/create/service.hbs`,
        serviceDdd: `${USECASES}/create/service-ddd.hbs`,
        serviceSpec: `${USECASES}/create/service-spec.hbs`,
        dtos: {
          dto: `${USECASES}/create/dtos/dto.hbs`,
          dtoSpec: `${USECASES}/create/dtos/dto-spec.hbs`,
        },
      },
      edit: {
        service: `${USECASES}/edit/service.hbs`,
        serviceDdd: `${USECASES}/edit/service-ddd.hbs`,
        serviceSpec: `${USECASES}/edit/service-spec.hbs`,
        dtos: {
          dto: `${USECASES}/edit/dtos/dto.hbs`,
          dtoSpec: `${USECASES}/edit/dtos/dto-spec.hbs`,
        },
      },
      delete: {
        service: `${USECASES}/delete/service.hbs`,
        serviceDdd: `${USECASES}/delete/service-ddd.hbs`,
        serviceSpec: `${USECASES}/delete/service-spec.hbs`,
      },
      findAll: {
        service: `${USECASES}/find-all/service.hbs`,
        serviceDdd: `${USECASES}/find-all/service-ddd.hbs`,
        serviceSpec: `${USECASES}/find-all/service-spec.hbs`,
        dtos: {
          dto: `${USECASES}/find-all/dtos/dto.hbs`,
          dtoSpec: `${USECASES}/find-all/dtos/dto-spec.hbs`,
        },
      },
      findById: {
        service: `${USECASES}/find-by-id/service.hbs`,
        serviceDdd: `${USECASES}/find-by-id/service-ddd.hbs`,
        serviceSpec: `${USECASES}/find-by-id/service-spec.hbs`,
      },
    },
  },

  // Infra
  infra: {
    controller: `${CONTROLLER}/controller.hbs`,
    controllerSpec: `${CONTROLLER}/controller-spec.hbs`,
    dao: `${DAO}/dao.hbs`,
    daoDdd: `${DAO}/dao-ddd.hbs`,
    daoSpec: `${DAO}/dao-spec.hbs`,
    repository: `${REPOSITORY}/repository.hbs`,
    repositorySpec: `${REPOSITORY}/repository-spec.hbs`,
  },

  // Domain
  domain: {
    entity: `${DOMAIN}/entity.hbs`,
    entitySpec: `${DOMAIN}/entity-spec.hbs`,
    enumStatus: `${ENUMS}/status.enum.hbs`,
    errorNotFound: `${ERRORS}/not-found.error.hbs`,
    errorAlreadyExists: `${ERRORS}/already-exists.error.hbs`,
  },

  // Module
  module: `${MODULE}/module.hbs`,
} as const;
