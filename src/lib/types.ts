export interface PresetV{
    h_local: string, h_global:string, ranges: Array<[string, Record<string, number|boolean>]>, z:number
}
export interface Preset extends PresetV{
    name:string
}

type num = number
type num2 = [num,num]
type str = string
type Rec<T> = Record<str, T> //record with fields of type t

export type {num, num2, str, Rec}