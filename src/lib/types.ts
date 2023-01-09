export type E<T> = (x: T) => T //endomorphism type
export type P<T> = Record<string, T> //record with fields of type t
export type fP<T> = Record<string,(x: T) => T> //endomorphism on records with fields of type t
export type num = number
export type param = {name: string} & P<num>
export type f_param = {name: string} & P<E<num>>
export interface PresetV{
    h_local: string, h_global:string, ranges: Array<[string, Record<string, number>]>, z:number
}
export interface Preset extends PresetV{
    name:string
}
export enum Constraints {
    Outisde,
    Within,
    Below,
    Above,
    Relative,
}