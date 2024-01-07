export function randomInt(a: number, b: number): number {
	if (a > b) [a, b] = [b, a];
	return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function randomFrom<T>(a: T[]): T {
	return a[Math.floor(Math.random() * a.length)];
}

export function shuffle<T>(array: T[]): T[] {
	return array.map((a: any) => ({ sort: Math.random(), value: a }))
		.sort((a: { sort: number; }, b: { sort: number; }) => a.sort - b.sort)
		.map((a: { value: any; }) => a.value)
}

export function seq(a: number): number[] {
	return [...Array(a).keys()]
	//=> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
}

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
export function gebi(id: string) {
	const element = document.getElementById(id);
	if (!element) throw ReferenceError(`element ${id} not found`);
	return element;
}
export function gibi(id: string) {
	const element = gebi(id);
	if (!(element instanceof HTMLInputElement)) throw ReferenceError(`element ${id} is not input`);
	return element;
}

export function setStatus(s: string) {
	gebi('status').innerText = s;
}

export function showDate(today: number) {
	gebi('now-day').innerText = (today + 1).toString();
	const year = Math.floor(today / 300) + 3000;
	const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][Math.floor((today % 300) / 30)];
	const day = Math.floor(today % 30) + 1;
	gebi('now-date').innerText = `${day} ${month} ${year}`;
	// const time = now % 1;
	// gebi('now-hr').innerText = Math.floor(time * 25);
	// gebi('now-min').innerText = Math.round((time * 25 * 50) % 25);
}
