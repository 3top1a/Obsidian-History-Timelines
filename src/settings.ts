import { App, PluginSettingTab, Setting } from 'obsidian'
import TimelinesPlugin from './main'

export class TimelinesSettingTab extends PluginSettingTab {
	plugin: TimelinesPlugin;

	constructor(app: App, plugin: TimelinesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'History Timelines Settings' });
		containerEl.createEl('p', { text: 'No settings for now' });


		// No settings for now
	}
}
