export interface PresetV{
    h_local: string, h_global:string, ranges: Array<[string, Record<string, number|boolean>]>, z:number
}
export interface Preset extends PresetV{
    name:string
}

type Rec<T> = Record<string, T> //record with fields of type t

type MuesliParameter = {
	a: number,
	b: number,
	c0: number,
	c1: number,
	z: number, 
	locked: boolean
}
type Endo<T> = (x: T) => T;
type Evolver<T> = {
    [Property in keyof T]: Endo<T[Property]>;
};
export type {Rec, MuesliParameter, Endo, Evolver}