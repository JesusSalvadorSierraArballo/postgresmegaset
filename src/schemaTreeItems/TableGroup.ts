import * as vscode from 'vscode';
import { CustomTree } from "../types";
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import * as path from 'path';
import { Table } from './Table';

export class TableGroup extends vscode.TreeItem implements CustomTree {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string },
    public schema: string
  ) {
    super("Tables", collapsibleState);
    this.tooltip = `${this.label}`;
    }

  getChildrens = async () => {
    const tables = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
        .getTables(this.schema);
      let dep = tables.rows.map((t: { table_name: string; })=> new Table(t.table_name, vscode.TreeItemCollapsibleState.None, this.server));
      return Promise.resolve(dep);
  };

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'table.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'table.svg')
  };
}