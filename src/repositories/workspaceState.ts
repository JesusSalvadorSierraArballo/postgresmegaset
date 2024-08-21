import { ExtensionContext } from "vscode";
import { TableStructure } from "../types";

export class WorkspaceState {
    static storeKeys = {
        TABLES_IN_ER: 'tablesInER'
    };

    constructor(context: ExtensionContext) { 
        this.context = context;
     }
     private context!: ExtensionContext;

    async getTablesInER(): Promise<TableStructure[]> {
        const tablesInER = await this.context.workspaceState.get(WorkspaceState.storeKeys.TABLES_IN_ER) as TableStructure[];
        return tablesInER;
    }
    
    async addTable(tableER: TableStructure) {
        const tables = await this.getTablesInER() || [];
        const isAdded = tables.some((t) =>  tableER.schema === t.schema && tableER.name === t.name );
        isAdded || await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, [...tables, tableER]);
    }

    async deleteTable(tableER: TableStructure) {
        const tables = await this.getTablesInER() || [];
        const newTables = tables.filter((t) => !(tableER.schema === t.schema && tableER.name === t.name) );
        await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, newTables);
    }
      
      async dropAllTablesInER() {
        await this.context.workspaceState.update(WorkspaceState.storeKeys.TABLES_IN_ER, []);
        return [];
    }
}



