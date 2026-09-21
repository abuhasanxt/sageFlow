export interface UserData {
    name:string,
    email:string,
    password:string

}
export interface UserLogin {
    email:string,
    password:string

}
export interface VerifyEmailData {
email:string,
otp:string
}
export  interface UpdateUser{
    name?:string
    image?:string
}