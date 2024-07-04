import * as vscode from 'vscode';
import * as path from 'path';
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import { TableER } from '../types';

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
    light: path.join(__filename, '..', '..', '..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..', '..', '..', 'src', 'assets', 'dark', 'table.svg')
  };

  async toER() {
    const tableStructure = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
    .getTablesStructure(this.schema, this.label);
    //TODO FIX THE KEYS
    let tb: TableER = {
      schema: this.schema,
      name: this.label,
      columns: tableStructure.rows.map((c: any) => ({
        name: c.column,
        datatype: c.dataType,
        isPrimaryKey: Boolean(c.isPrimaryKey),
        isForeignKey: Boolean(c.isForeignKey),
        relationship: {
          schema: c.schemaDestination,
          table: c.tableDestination,
          column: c.columna_destino,
        }
      }))
    };
    return Promise.resolve(tb);
  }

  contextValue = 'table';
}