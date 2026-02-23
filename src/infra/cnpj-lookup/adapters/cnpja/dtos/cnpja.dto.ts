export class CnpjaOutputDto {
  taxId: string;
  alias: string | null;
  founded: string;
  head: boolean;
  statusDate: string;
  status: {
    id: number;
    text: string;
  };
  address: {
    zip: string;
    street: string;
    number: string;
    details: string;
    district: string;
    city: string;
    state: string;
  };
  mainActivity: {
    id: number;
    text: string;
  };
  company: Company;
  phones: Phone[];
  emails: Email[];
  sideActivities: SideActivity[];
}

class Company {
  id: number;
  name: string;
  equity: number;
  nature: {
    id: number;
    text: string;
  };
  size: {
    id: number;
    acronym: string;
    text: string;
  };
  simples: {
    optant: boolean;
    since: string;
  };
  simei: {
    optant: boolean;
    since: string;
  };
}

class Phone {
  type: string;
  area: string;
  number: string;
}

class Email {
  ownership: string;
  address: string;
  domain: string;
}

class SideActivity {
  id: number;
  text: string;
}
