export type E<T> = (x: T) => T //endomorphism type
export type P<T> = Record<string, T> //record with fields of type t
export type fP<T> = P<E<T>> //endomorphism on records with fields of type t
export type num = number
export type param = {name: string} & P<num>
export type f_param = {name: string} & P<E<num>>
export interface PresetV{
    h_local: string, h_global:string, data: Record<string, number>, zoom:number
}
export interface Preset extends PresetV{
    name:string
}