/*
I chose to use raw queries instead of using a modeller library such as "sequelize".
Just wanted to experience how it would be by using raw queries, no other specific reason.
*/

import * as mssql from 'mssql';
import { IParam } from './param';

export class MsSqlApi {

    private sqlConfig = {
        user: "MessengerApp",
        password: "12345",
        database: "MessengerApp",
        server: 'localhost',
        pool: {
          max: 1000,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          trustServerCertificate: true // change to true for local dev / self-signed certs
        }
    }

    private conn;

    constructor(){
        this.connectToDB();
    }

    private async connectToDB(){
        try {
            this.conn = await mssql.connect(this.sqlConfig);
        } catch (err) {
            console.log(err);
        }
    }

    private async runSQL(sqlQuery: string, isSP: boolean, params?: IParam[]): Promise<any> {
        let result: any;
        let request = this.conn.request();
        try {
            if(params){
                for(const param of params){
                    request.input(param.paramName, param.paramValue);
                }
            }
            if(isSP){
                result = await request.execute(sqlQuery);
            } else {
                result = await request.query(sqlQuery);                
            }
        } catch (err) {
            console.log(err);
            result = undefined;
        }
        return result;
    }

    //#region Data Control

    async checkLoginInfoTrue(eMail: string, encPass: string) : Promise<boolean> {
        let retVal = true;
        let eMailPar: IParam = { paramName: "UserEMail", paramValue: eMail};
        let passPar: IParam = { paramName: "Password", paramValue: encPass};
        let params: IParam[] = [];
        params.push(eMailPar);
        params.push(passPar);
        let query = "select 1 from Users (nolock) where userEMail = @UserEMail and userPassword = @Password";
        let result = await this.runSQL(query, false, params);
        if(!result || result.rowsAffected[0] === 0){
            retVal = false;
        }
        return retVal;
    }

    async selectEMailExists(eMail: string) : Promise<boolean> {
        let retVal = true;
        let param: IParam = { paramName: "UserEMail", paramValue: eMail};
        let params: IParam[] = [];
        params.push(param);
        let query = "select 1 from Users (nolock) where userEMail = @UserEMail";
        let result = await this.runSQL(query, false, params);
        if(result){
            if(result.rowsAffected[0] === 0){
                retVal = false;
            }
        } else {
            retVal = false;
        }
        return retVal;
    }

    //#endregion

    //#region Register

    async register(eMail: string, encPass: string) : Promise<boolean> {
        let retVal = true;
        let eMailPar: IParam = { paramName: "UserEMail", paramValue: eMail};
        let passPar: IParam = { paramName: "Password", paramValue: encPass};
        let params: IParam[] = [];
        params.push(eMailPar);
        params.push(passPar);
        let query = "insert Users (userEmail, userPassword) values (@UserEMail, @Password)";
        let result = await this.runSQL(query, false, params);
        if(!result || result.rowsAffected[0] === 0){
            retVal = false;
        }
        return retVal;
    }

    //#endregion

}