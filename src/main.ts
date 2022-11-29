import type { TimelinesSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { TimelinesSettingTab } from './settings';
import { Plugin } from 'obsidian';
import { TimelineView, VIEW_TYPE_TIMELINE } from "./view";
import { parse } from 'yaml'
import { createDate, formatDate } from './utils';

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		// Load message
		console.log('Loaded History Timelines Plugin');

		await this.loadSettings();

		// Register timeline command and side button
		this.addRibbonIcon("bar-chart-horizontal", "Timeline", async () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-history-timeline",
			name: "Open History Timeline",
			callback: () => {
				this.activateView();
			},
		});

		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this)
		);

		this.registerMarkdownCodeBlockProcessor("timeline", (source, el, ctx) => {
			const event = parse(source);
			const container = el.createDiv({ cls: "ob-his-timeline-block" })

			console.debug(event);

			let start_date = event.date;
			if (!start_date) {
				container.createEl("p", { text: "Invalid start date!" });
			}

			let end_date = event.end ?? null;
			let title = event.title ?? ctx.sourcePath.slice(0, ctx.sourcePath.length - 3);
			let color = event.color ?? null;
			let group = event.group ?? null;
			let img = event.img ?? null;

			let paragraph = container.createEl("p");
			let pr_color = (color != null) ? "color: " + color + ";" : "";

			paragraph.createSpan({ text: title, attr: { "style": "font-weight: bold; " + pr_color } });

			if (group) {
				paragraph.createSpan({ text: " (group " + group + ") ", attr: { "style": "font-weight: light; " + pr_color } });
			}

			paragraph.createSpan({ text: " - " });
			paragraph.createSpan({ text: formatDate(createDate(start_date)), attr: { "style": "font-style: italic;" } });

			// Check end date and draw it/warn acordingly
			if (end_date === 'Invalid Date') {
				paragraph.createSpan({ text: " to " });
				paragraph.createSpan({ text: "Invalid date!", attr: { "style": "font-weight: bold; color: #e8000d;" } });
			}
			else if (end_date) {
				paragraph.createSpan({ text: " to " });
				paragraph.createSpan({ text: formatDate(createDate(end_date)), attr: { "style": "font-style: italic;" } });
			}

			// If there is an image, show it
			if (img) {
				paragraph.createEl('img', { attr: { "href": img } })
			}
		});

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
