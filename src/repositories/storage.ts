import { ExtensionContext } from "vscode";

export class Storage {
    static storeKeys = {
        CONNECTIONS: 'connections'
    };

    constructor(context: ExtensionContext) { 
        this.context = context
     }
     private context!: ExtensionContext;

    async getConnections(): Promise<{user: string,password: string,host: string,port: number}[]> {
        const connections = await this.context.secrets.get(Storage.storeKeys.CONNECTIONS);
        if(typeof connections === 'string') return JSON.parse(connections);
        return []
    }

    async saveConection(user: string, password: string, host: string = 'localhost', port: number = 5334) {
        const connections = await this.getConnections();
        const newConnection = {
            user,
            password,
            host,
            port
        }
        
        await this.context.secrets.store(Storage.storeKeys.CONNECTIONS, JSON.stringify([...connections, newConnection]));
    }
        
    async dropAllConnections(): Promise<{user: string,password: string,host: string,port: number}[]> {
        await this.context.secrets.store(Storage.storeKeys.CONNECTIONS, JSON.stringify([]));
        return []
    }
}

