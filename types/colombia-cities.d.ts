declare module "colombia-cities" {
  export type ColombiaDepartment = {
    department?: string;
    name?: string;
    code?: string | number;
  };

  export type ColombiaCity = {
    city?: string;
    name?: string;
    code?: string | number;
  };

  export function getDepartments(): Array<
    string | ColombiaDepartment
  >;

  export function getCitiesByDepartment(
    department: string
  ): Array<string | ColombiaCity>;
}