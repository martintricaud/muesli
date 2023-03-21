import * as R from 'ramda'
let e = 0.000001

export const constraintsPreset = [
	{
		predicate: obj => obj.c1 - obj.c0 >= e,
		// udpate to apply to the object for an incoming f update 
		g: (f,v) => {
			return {
				c0: x => f.c1(x - e / 2) - e / 2,
				c1: x => f.c0(x + e / 2) + e / 2
			}
		}
	},
	{
		predicate: obj => obj.z <= obj.c1 - obj.c0 && obj.z >= e,
		g: (f,v) => {
			return {
				z: x=>R.clamp(e, f.c1(v.c1)-f.c0(v.c0),f.z(x))
			}
		}
	},
	{
		predicate: obj => obj.b >= obj.c0+obj.z/2 && obj.b <=  obj.c1-obj.z/2,
		g: (f,v) => {
			return {
				b: x=>R.clamp(f.c0(v.c0)+f.z(v.z)/2, f.c1(v.c1)-f.z(v.z)/2, f.b(x))
			}
		}
	},
	{
		predicate: obj => obj.a >= obj.b - obj.z / 2 && obj.a <= obj.b + obj.z / 2, 
		g: (f,v) => {
			return {
				a: x=> R.clamp(f.b(v.b) - f.z(v.z) / 2, f.b(v.b) + f.z(v.z) / 2, f.a(x))
			}
		}
	}
]