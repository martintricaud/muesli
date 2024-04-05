import * as R from 'ramda'
import * as U from './utils';
interface Vec {
    x: number,
    y: number,
    z: number
}

export const scale = R.curry((K, B: Partial<Vec>) => U.evolve({ x: x => x * K, y: y => y * K }, B))
export const scaleFrom = R.curry((K, B: Partial<Vec>, A: Partial<Vec>) => U.evolve({ x: x => x * K + A.x, y: y => y * K + A.y }, B))
export const dot = (A:Partial<Vec>, B:Partial<Vec>) => A.x * B.x + A.y * B.y
export const norm = (A:Partial<Vec>) => Math.sqrt(dot(A,A))
export const setNorm = (K: number, B: Partial<Vec>) => scale(K, unit(B))
export const add = (B: Partial<Vec>, A: Partial<Vec>) => U.evolve({ x: x => x + B.x, y: y => y + B.y }, A)
export const sub = (B: Partial<Vec>, A: Partial<Vec>) => U.evolve({ x: x => x - B.x, y: y => y - B.y }, A)
export const unit = (B: Partial<Vec>) => scale(1 / norm(B), B)
export const cross = (A: Partial<Vec>, B: Partial<Vec>) => {
    return {
        x: A.y * B.z - A.z * B.y,
        y: A.z * B.x - A.x * B.z,
        z: A.x * B.y - A.y * B.x
    }
}
export const project = R.curry((B, A) => scale(dot(A,B)/norm(B), B))
export const projectXAB = (X, A, B) => add(A,
    scale(dot(sub(A, X), sub(A, B)) / (norm(sub(A, B))),unit(sub(A, B))))

//flip B around A
export const flip = R.curry((A, B) => {
    return {
        x: 2 * A.x - B.x,
        y: 2 * A.y - B.y
    }
})

export const scaleAroundU = R.curry((A, k, B) => {
    return {
        x: (A.x * (1 + k) - B.x) / k,
        y: (A.y * (1 + k) - B.y) / k
    }
})
