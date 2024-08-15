import * as vscode from 'vscode';
import * as path from 'path';
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import { TableStructure } from '../types';

export class Table extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string },
    public schema:string 
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }

  iconPath = {
    light: path.join(__filename,'..',  '..', '..', '..', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__dirname, '..', '..', 'assets', 'dark', 'table.svg')
  };

  async getTableStructure() {
    const tableStructure = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
    .getTablesStructure(this.schema, this.label);
    //TODO FIX THE KEYS 
    const columns = tableStructure.rows.
      filter((c: any, index: number, self: Array<any>) =>
        index === self.findIndex((t) => (
          t.column === c.column && t.schema === c.schema
        )))
      .map((c: any) => ({
        name: c.column,
        datatype: c.dataType,
        isPrimaryKey: Boolean(c.isPrimaryKey),
        isForeignKey: Boolean(c.isForeignKey),
        relationship: {
          schema: c.schemaDestination,
          table: c.tableDestination,
          column: c.columna_destino,
        }
      }));

    let tb: TableStructure = {
      schema: this.schema,
      name: this.label,
      columns
    };
    return Promise.resolve(tb);
  }

  getSelectTop = async () => 
    {
      const tableStructure = await (this.getTableStructure());
      return `SELECT\n${ tableStructure.columns.map((c)=> `  "${c.name}"`).join(",\n")}\nFROM '${tableStructure.schema}'.'${tableStructure.name}'`;
    }; 

  contextValue = 'table';
}