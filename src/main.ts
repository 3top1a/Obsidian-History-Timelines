import type { TimelinesSettings } from './types';
import { DEFAULT_SETTINGS, TIMELINE_ICON } from './constants';
import { TimelinesSettingTab } from './settings';
import { Plugin, addIcon } from 'obsidian';
import { TimelineMacro } from './modal';

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		// Load message
		await this.loadSettings();
		console.log('Loaded History Timelines Plugin');

		// Register timeline icon and side button
		addIcon("timeline-timeline", TIMELINE_ICON);
		this.addRibbonIcon("timeline-timeline", "Timeline", async () => {
			new TimelineMacro(this.app, this).open();
		});

		this.addSettingTab(new TimelinesSettingTab(this.app, this));
	}

	onunload() {
		console.log('Unloading History Timelines plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
