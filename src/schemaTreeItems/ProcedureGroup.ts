import * as vscode from 'vscode';
import { CustomTree } from "../types";
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import * as path from 'path';
import { Procedure } from './Procedure';

export class ProcedureGroup extends vscode.TreeItem implements CustomTree {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string },
    public schema: string
  ) {
    super("Procedures", collapsibleState);
    this.tooltip = `${this.label}`;
    }

  getChildrens = async () => {
    const procedures = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
        .getStoreProcedure(this.schema);
      let dep = procedures.rows.map((p: { function_name: string; })=> new Procedure(p.function_name, vscode.TreeItemCollapsibleState.Collapsed, this.server));
      return Promise.resolve(dep);
  };

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'procedure.svg')
  };
}