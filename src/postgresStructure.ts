import * as vscode from 'vscode';
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

    if(element && element as CustomTree) { 
      return await element.getChildrens();
    } else {
      let connections =  await this.store.getConnections();
        const dependencies = connections.map((c) => new Instance(c.host, vscode.TreeItemCollapsibleState.Collapsed, c));
        return Promise.resolve(dependencies);
    }
  }


  private _onDidChangeTreeData: vscode.EventEmitter<Instance | undefined | null | void> = new vscode.EventEmitter<Instance | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Instance | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

}
/////////////////////////////////////////////////////////////////
interface CustomTree {
  getChildrens: () => {}
}
class Instance extends vscode.TreeItem implements CustomTree {
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
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'database.svg')
  };

  contextValue = 'database';
}

class Schema extends vscode.TreeItem implements CustomTree {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string }
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }

  getChildrens = () =>  Promise.resolve([
      new ProcedureGroup(vscode.TreeItemCollapsibleState.Collapsed, this.server, this.label),
      new TableGroup(vscode.TreeItemCollapsibleState.Collapsed, this.server, this.label)
    ]);
  

  iconPath = {
    light: path.join(__filename, '..','..', 'src', 'assets', 'light', 'schema.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'schema.svg')
  };
}

class TableGroup extends vscode.TreeItem implements CustomTree {
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

class ProcedureGroup extends vscode.TreeItem implements CustomTree {
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
class Procedure extends vscode.TreeItem {
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
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'procedure.svg')
  };
}
class Table extends vscode.TreeItem {
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
    dark: path.join(__filename, '..','..', 'src', 'assets', 'dark', 'procedure.svg')
  };
}