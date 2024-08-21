export interface CustomTree {
  getChildrens: () => {}
}
export interface column {
  name: string,
  datatype: string,
  presicion?: number,
  isPrimaryKey: boolean,
  isForeignKey: boolean,
  relationship?: {
    schema: string,
    table: string,
    column: string,
  }
}
export interface TableStructure {
  schema: string,
  name: string,
  columns: column[]
}

export interface TableInfo {
  schema: string,
  table: string,
  column: string,
  is_nullable: 'YES' | 'NO', 
  dataType:string
  ordinal_position: number,
  tipo_presicion: string,
  numericprecision: number | null,
  numeric_scale: number | null,
  es_integer:  1 | 0,
  isString: 1 | 0,
  es_bit: 1 | 0,
  isDate: 1 | 0,
  isPrimaryKey: 1 | 0,
  isForeignKey: 1 | 0,
  posicion_primary: 1 | 0,
  catalogo_origen: string | null,
  shema_origen: string | null,
  tabla_origen: string | null,
  columna_origen: string | null,
  constraint_name: string | null,
  unique_constraint_name: string,
  catalogo_destino: string | null,
  schemaDestination: string | null,
  tableDestination: string | null,
  columna_destino: string | null,
  secondColumn: string | null,
  requiere_secuencia: 1 | 0,
  isStatus: 1 | 0,
  nullable: 1 | 0
}