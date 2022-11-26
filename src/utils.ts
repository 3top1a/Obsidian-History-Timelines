import type { DataAdapter } from 'obsidian';
import * as dayjs from 'dayjs';

/**
 * Create date of passed string
 * @date - string date in the format YYYY-MM-DD-HH
 */
export function createDate(date_string: string): Date {
	return dayjs(date_string).toDate();
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
