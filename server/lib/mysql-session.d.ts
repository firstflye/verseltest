declare module 'express-mysql-session' {
  import session from 'express-session';
  
  interface Options {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
    checkExpirationInterval?: number;
    expiration?: number;
    createDatabaseTable?: boolean;
    connectionLimit?: number;
    endConnectionOnClose?: boolean;
    clearExpired?: boolean;
  }
  
  interface MySQLStore extends session.Store {
    new(options: Options): MySQLStore;
  }
  
  function MySQLStoreFactory(session: any): {
    new(options: Options): session.Store;
  };
  
  export = MySQLStoreFactory;
}