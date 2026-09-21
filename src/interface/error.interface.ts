export interface TErrorSources {
    path:string;
    message:string
}


export interface TErrorResponse {
    statusCode?:number;
    success:boolean;
    errorMessage:string;
    errorSources:TErrorSources[];
    stack?:string;
    error?:unknown
}