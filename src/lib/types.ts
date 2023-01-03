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
export interface PresetV2{
    h_local2: Record<string, string>, h_global2:Record<string, string>, ranges: Array<[string, Record<string, number>]>, z:number
}
export interface Preset2 extends PresetV2{
    name:string
}

export interface PresetV3{
    macro: Array<[string, Record<string, string>]>, ranges: Array<[string, Record<string, number>]>, z:number
}
export interface Preset3 extends PresetV3{
    name:string
}
export enum Constraints {
    Outisde,
    Within,
    Below,
    Above,
    Relative,
}