import * as vscode from 'vscode';
import * as path from 'path';
import { PgConnect } from '../pgconnect';
import { ConnectionInfo } from '../conectionInfo';

export class Procedure extends vscode.TreeItem {
	
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string },
    public schema:string 
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }

  iconPath = {
    light: path.join(__filename, '..','..','..', 'src', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__filename, '..','..','..','src', 'assets', 'dark', 'procedure.svg')
  };
  
  async getSource(): Promise<string> {
    const procedureStructure = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
    .getProcedureSource(this.schema, this.label);

    
    return procedureStructure.rows[0]["prosrc"];
	}

  contextValue = 'procedure';

}