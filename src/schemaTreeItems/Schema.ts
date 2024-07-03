import * as vscode from 'vscode';
import { CustomTree } from "../types";
import * as path from 'path';
import { ProcedureGroup } from './ProcedureGroup';
import { TableGroup } from './TableGroup';

export class Schema extends vscode.TreeItem implements CustomTree {
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
    light: path.join(__filename, '..','..','..', 'src', 'assets', 'light', 'schema.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..','..', 'src', 'assets', 'dark', 'schema.svg')
  };
}