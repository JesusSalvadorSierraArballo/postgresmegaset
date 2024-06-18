import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { Storage } from './repositories/storage';
import { ConnectionInfo } from './conectionInfo';
import { PgConnect } from './pgconnect';

export class PostgresProvider implements vscode.TreeDataProvider<Instance> {
  
  constructor(context: ExtensionContext) { 
    this.store = new Storage(context);
  }

  private store!: Storage;

  getTreeItem(element: Instance | Database): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Instance | Database | Schema) {

    if(element && element instanceof Schema) {
      return Promise.resolve([
        new Procedure(vscode.TreeItemCollapsibleState.None, element.server),
        new Table(vscode.TreeItemCollapsibleState.None, element.server)
      ]);
    }
    else if(element && element instanceof Database) {
     const schemas = await new ConnectionInfo(new PgConnect(element.server.user, element.server.password, element.server.host, element.server.port, element.label)).getSchemas();
      let dep = schemas.rows.map((db: { nspname: string; })=> new Schema(db.nspname, vscode.TreeItemCollapsibleState.Collapsed, element.server));
      return Promise.resolve(dep);
    }
    else if (element && element instanceof Instance) {
      const databases = await new ConnectionInfo(new PgConnect(element.server.user, element.server.password, element.server.host, element.server.port)).getDatabases();
      let dep = databases.rows.map((db: { datname: string; })=> 
        new Database(db.datname, 
          vscode.TreeItemCollapsibleState.Collapsed, 
          {...element.server, database:db.datname}));
      return Promise.resolve(dep);
    } else {
      let connections =  await this.store.getConnections();
      console.log(new Instance(connections[0].host, vscode.TreeItemCollapsibleState.Collapsed, connections[0]).iconPath.light);
        const dependencies = connections.map((c) => new Instance(c.host, vscode.TreeItemCollapsibleState.Collapsed, c));
        return Promise.resolve(dependencies);
    }
  }
}


class Instance extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;

    }

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'data-cluster.svg')
  };
}

class Database extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;

    }

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'database.svg')
  };
}

class Schema extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'schema.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'schema.svg')
  };
}

class Table extends vscode.TreeItem {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super("Tables", collapsibleState);
    this.tooltip = `${this.label}`;

    }

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'table.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'table.svg')
  };
}

class Procedure extends vscode.TreeItem {
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super("Procedures", collapsibleState);
    this.tooltip = `${this.label}`;
    }

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'procedure.svg')
  };
}