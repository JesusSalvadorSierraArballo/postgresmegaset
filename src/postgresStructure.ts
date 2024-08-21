import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import { Storage } from './repositories/storage';
import { CustomTree } from './types';
import { Instance } from './schemaTreeItems/Instance';
import { Database } from './schemaTreeItems/Database';
import { Schema } from './schemaTreeItems/Schema';

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
        const instance = connections.map((c) => new Instance(c.host, vscode.TreeItemCollapsibleState.Collapsed, c));
        return Promise.resolve(instance);
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Instance | undefined | null | void> = new vscode.EventEmitter<Instance | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Instance | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export { Database };
