export interface PresetV{
    h_local: string, h_global:string, ranges: Array<[string, Record<string, number|boolean>]>, z:number
}
export interface Preset extends PresetV{
    name:string
}
