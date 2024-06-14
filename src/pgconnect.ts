import pg from 'pg'

export class PgConnect {
    pgConnect(user: string, password: string, host: string = 'localhost', port: number = 5334, database: string) {
        this.user = user;
        this.password = password;
        this.host = host;
        this.port = port;
        this.database = database;
    }

    user: string = ''; 
    password: string = ''; 
    host: string = 'localhost'; 
    port: number = 5334; 
    database: string = '';


    async getClient() {
        const { Client } = pg
        const c = new Client({
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: this.database,
        })

        const client = new Client()
        await c.connect()

        const res = await c.query('SELECT $1::text as message', ['Hello world!'])
        console.log(res.rows[0].message) // Hello world!
        await c.end()
    }
}