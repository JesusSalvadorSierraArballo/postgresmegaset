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

  async getChildren(element?: Instance): Promise<Instance[]> {

    if(element && element.getLevel() === DEPENDENCY_LEVEL.SCHEMAS) {
      return Promise.resolve([
        new Instance("Procedures", DEPENDENCY_LEVEL.OBJECTS_TYPES, vscode.TreeItemCollapsibleState.None, element.server),
        new Instance("Tables", DEPENDENCY_LEVEL.OBJECTS_TYPES, vscode.TreeItemCollapsibleState.None, element.server)
      ]);
    }
    else if(element && element.getLevel() === DEPENDENCY_LEVEL.DATABASE){
     const schemas = await new ConnectionInfo(new PgConnect(element.server.user, element.server.password, element.server.host, element.server.port, element.label)).getSchemas();
     console.log(schemas);
      let dep = schemas.rows.map((db: { nspname: string; })=> new Instance(db.nspname, DEPENDENCY_LEVEL.SCHEMAS, vscode.TreeItemCollapsibleState.Collapsed, element.server));
      return Promise.resolve(dep);
    }
    else if (element && 
    //  element.getLevel() === DEPENDENCY_LEVEL.INSTANCE
      element instanceof Instance
    ) {
      const databases = await new ConnectionInfo(new PgConnect(element.server.user, element.server.password, element.server.host, element.server.port)).getDatabases();
      let dep = databases.rows.map((db: { datname: string; })=> 
        new Database(db.datname, 
          DEPENDENCY_LEVEL.DATABASE, 
          vscode.TreeItemCollapsibleState.Collapsed, 
          {...element.server, database:db.datname}));
      return Promise.resolve(dep);
    } else {
      let connections =  await this.store.getConnections();
      console.log(new Instance(connections[0].host, DEPENDENCY_LEVEL.INSTANCE, vscode.TreeItemCollapsibleState.Collapsed, connections[0]).iconPath.light);
        const dependencies = connections.map((c) => new Instance(c.host, DEPENDENCY_LEVEL.INSTANCE, vscode.TreeItemCollapsibleState.Collapsed, c));
        return Promise.resolve(dependencies);
    }
  }
}

enum DEPENDENCY_LEVEL {
  INSTANCE,
  DATABASE,
  SCHEMAS,
  OBJECTS_TYPES,
  OBJECTS,
  TABLES,
  PROCEDURES
}

class Instance extends vscode.TreeItem {
  static DEPENDENCY_LEVEL = DEPENDENCY_LEVEL;
  constructor(
    public readonly label: string,
    private dependencyLevel: DEPENDENCY_LEVEL,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;

    }
    getLevel(): DEPENDENCY_LEVEL {
      return this.dependencyLevel;
    } 

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'database.svg')
  };
}

class Database extends vscode.TreeItem {
  static DEPENDENCY_LEVEL = DEPENDENCY_LEVEL;
  constructor(
    public readonly label: string,
    private dependencyLevel: DEPENDENCY_LEVEL,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;

    }
    getLevel(): DEPENDENCY_LEVEL {
      return this.dependencyLevel;
    } 

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'database.svg')
  };
}