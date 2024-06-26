import * as vscode from 'vscode';
import { CustomTree } from "../types";
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import { Database } from './Database';
import * as path from 'path';

export class Instance extends vscode.TreeItem implements CustomTree {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number }
  ) {
      super(label, collapsibleState);
      this.tooltip = `${this.label}`;
    }

  getChildrens = async () => {
    const databases = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port)).getDatabases();
      let dep = databases.rows.map((db: { datname: string; }) => 
        new Database(db.datname, 
          vscode.TreeItemCollapsibleState.Collapsed, 
          {...this.server, database:db.datname}));
      return Promise.resolve(dep);
  };

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'data-cluster.svg')
  };

  contextValue = 'instance';
}