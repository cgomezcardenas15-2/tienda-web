import {
  getDepartments,
  getCitiesByDepartment,
} from "colombia-cities";

export type Departamento = {
  nombre: string;
  codigo?: string;
};

export type Municipio = {
  nombre: string;
  codigo?: string;
};

type DepartamentoLibreria = {
  id?: number | string;
  nombre?: string;
};

type MunicipioLibreria = {
  id?: number | string;
  nombre?: string;
};

export function obtenerDepartamentos(): Departamento[] {
  const departamentos =
    getDepartments() as DepartamentoLibreria[];

  return departamentos
    .map((departamento) => ({
      nombre: departamento.nombre ?? "",
      codigo:
        departamento.id !== undefined
          ? String(departamento.id)
          : undefined,
    }))
    .filter(
      (departamento) =>
        departamento.nombre.trim() !== ""
    )
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
}

export function obtenerMunicipios(
  departamento: string
): Municipio[] {
  if (departamento.trim() === "") {
    return [];
  }

  const municipios =
    getCitiesByDepartment(
      departamento
    ) as MunicipioLibreria[];

  return municipios
    .map((municipio) => ({
      nombre: municipio.nombre ?? "",
      codigo:
        municipio.id !== undefined
          ? String(municipio.id)
          : undefined,
    }))
    .filter(
      (municipio) =>
        municipio.nombre.trim() !== ""
    )
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
}