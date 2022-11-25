import type { TimelinesSettings } from './types';
import { DEFAULT_SETTINGS, TIMELINE_ICON } from './constants';
import { TimelinesSettingTab } from './settings';
import { Plugin, addIcon } from 'obsidian';
import { TimelineView, VIEW_TYPE_TIMELINE } from "./view";

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		// Load message
		console.log('Loaded History Timelines Plugin');

		await this.loadSettings();

		// Register timeline icon and side button
		addIcon("timeline-timeline", TIMELINE_ICON);
		this.addRibbonIcon("timeline-timeline", "Timeline", async () => {
			this.activateView();
		});

		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this)
		);

		this.addSettingTab(new TimelinesSettingTab(this.app, this));
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE);

		await this.app.workspace.getLeaf(false).setViewState({
			type: VIEW_TYPE_TIMELINE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE)[0]
		);
	}

	onunload() {
		console.log('Unloading History Timelines plugin');
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TIMELINE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
