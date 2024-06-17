import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { Storage } from './repositories/storage';

export class PostgresProvider implements vscode.TreeDataProvider<Dependency> {
  
  constructor(context: ExtensionContext) { 
    this.store = new Storage(context)
  }

  private store!: Storage;

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Dependency): Promise<Dependency[]> {

    if (element && 
      element.getLevel() === DEPENDENCY_LEVEL.INSTANCE) {
      
      return Promise.resolve([new Dependency('label', 'version', DEPENDENCY_LEVEL.DATABASE, vscode.TreeItemCollapsibleState.None)]);
    } else {
        let connections =  await this.store.getConnections();
        const dependencies = connections.map((c) => new Dependency(c.host, 'version', DEPENDENCY_LEVEL.INSTANCE, vscode.TreeItemCollapsibleState.Collapsed))
        return Promise.resolve(dependencies);
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}
enum DEPENDENCY_LEVEL {
  INSTANCE,
  DATABASE,
  OBJECTS_TYPES,
  OBJECTS
}
class Dependency extends vscode.TreeItem {
  static DEPENDENCY_LEVEL = DEPENDENCY_LEVEL
  constructor(
    public readonly label: string,
    private version: string,
    private dependencyLevel: DEPENDENCY_LEVEL,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;

    }
    getLevel(): DEPENDENCY_LEVEL {
      return this.dependencyLevel;
    } 

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}