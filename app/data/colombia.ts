import colombia from "./datasets/colombia.json";

export type Departamento = {
  nombre: string;
  codigo?: string;
};

export type Municipio = {
  nombre: string;
  codigo?: string;
};

type DepartamentoLibreria = {
  codigo?: number | string;
  nombre?: string;
  municipios?: MunicipioLibreria[];
};

type MunicipioLibreria = {
  codigo?: number | string;
  nombre?: string;
};

export function obtenerDepartamentos(): Departamento[] {
  const departamentos = colombia.departamentos as DepartamentoLibreria[];

  return departamentos
    .map((departamento) => ({
      nombre: departamento.nombre ?? "",
      codigo:
        departamento.codigo !== undefined
          ? String(departamento.codigo)
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

  const departamentoEncontrado = (colombia.departamentos as DepartamentoLibreria[])
    .find((item) => item.nombre?.toLocaleLowerCase("es") === departamento.toLocaleLowerCase("es"));
  const municipios = departamentoEncontrado?.municipios ?? [];

  return municipios
    .map((municipio) => ({
      nombre: municipio.nombre ?? "",
      codigo:
        municipio.codigo !== undefined
          ? String(municipio.codigo)
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
