import type { DataAdapter } from 'obsidian';

/**
 * Create date of passed string
 * @date - string date in the format YYYY-MM-DD-HH
 * TODO - Parse from more formats, including YYYY, YYYY-MM, maybe unix, etc.
 */
export function createDate(date: string): Date {
	let dateComp = date.split(',');
	// cannot simply replace '-' as need to support negative years
	return new Date(+(dateComp[0] ?? 0), +(dateComp[1] ?? 0), +(dateComp[2] ?? 0), +(dateComp[3] ?? 0));
}

/**
 * Return URL for specified image path
 * @param path - image path
 */
export function getImgUrl(vaultAdaptor: DataAdapter, path: string): string {

	if (!path) {
		return null;
	}

	let regex = new RegExp('^https:\/\/');
	if (path.match(regex)) {
		return path;
	}

	return vaultAdaptor.getResourcePath(path);
}
