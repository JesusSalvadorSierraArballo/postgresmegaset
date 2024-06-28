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
export interface TableER {
  schema: string,
  name: string,
  columns: column[]
}