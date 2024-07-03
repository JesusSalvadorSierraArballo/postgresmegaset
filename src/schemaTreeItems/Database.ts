import * as vscode from 'vscode';
import { CustomTree } from "../types";
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import * as path from 'path';
import { Schema } from './Schema';

export class Database extends vscode.TreeItem implements CustomTree {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }
  getChildrens = async () => {
    const schemas = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.label)).getSchemas();
      let dep = schemas.rows.map((db: { schema_name: string; })=> new Schema(db.schema_name, vscode.TreeItemCollapsibleState.Collapsed, this.server));
      return Promise.resolve(dep);
  };

  iconPath = {
    light: path.join(__filename, '..', '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..', '..','..', 'src', 'assets', 'dark', 'database.svg')
  };

  contextValue = 'database';
}