import { ExtensionContext } from "vscode";
import { TableER } from "../types";

export class WorkspaceState {
    static storeKeys = {
        TABLES_IN_ER: 'tablesInER'
    };

    constructor(context: ExtensionContext) { 
        this.context = context;
     }
     private context!: ExtensionContext;

    async getTablesInER(): Promise<TableER[]> {
        const tablesInER = await this.context.workspaceState.get(WorkspaceState.storeKeys.TABLES_IN_ER) as TableER[];
        return tablesInER;
    }
    
    async addTable(tableER: TableER) {
        const tables = await this.getTablesInER() || [];
        const isAdded = tables.some((t) =>  tableER.schema === t.schema && tableER.name === t.name );
        isAdded || await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, [...tables, tableER]);
    }

    async deleteTable(tableER: TableER) {
        const tables = await this.getTablesInER() || [];
        const newTables = tables.filter((t) => !(tableER.schema === t.schema && tableER.name === t.name) );
        await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, newTables);
    }
      
      async dropAllTablesInER() {
        await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, []);
        return [];
    }
}



