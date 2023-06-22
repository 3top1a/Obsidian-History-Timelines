import type { TimelinesSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { TimelinesSettingTab } from './settings';
import { Plugin } from 'obsidian';
import { TimelineView, VIEW_TYPE_TIMELINE } from "./view";
import { parse } from 'yaml'
import { createDate, formatDate } from './utils';
import { Suggest } from './suggest';

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

		this.registerMarkdownCodeBlockProcessor("tl", (source, el, ctx) => {
			// Create a container div for the timeline block
			const container = el.createDiv({ cls: "ob-his-timeline-block" })

			// Parse the event from the source
			try {
				var event = parse(source);
			} catch (error) {
				// Throw error
				let paragraph = container.createEl("p");
				paragraph.createSpan({ text: error });
				return
			}

			// Get the start date of the event
			let start_date = event.date;

			// Display an error message if the start date is invalid
			if (!start_date) {
				container.createEl("p", { text: "Invalid start date!" });
			}

			// Get the end date, title, color, group, and image of the event with default values
			let end_date = event.end ?? null;
			let title = event.title ?? ctx.sourcePath.slice(0, ctx.sourcePath.length - 3);
			let color = event.color ?? null;
			let group = event.group ?? null;
			let img = event.img ?? null;

			// Create a paragraph element within the container
			let paragraph = container.createEl("p");

			// Set the color of the title if specified
			let pr_color = (color != null) ? "color: " + color + ";" : "";

			// Create a span element for the title with the specified color and font weight
			paragraph.createSpan({ text: title, attr: { "style": "font-weight: bold; " + pr_color } });

			// Create a span element for the group if specified, with a lighter font weight
			if (group) {
				paragraph.createSpan({ text: " (group " + group + ") ", attr: { "style": "font-weight: light; " + pr_color } });
			}

			// Create a span element for the dash separator
			paragraph.createSpan({ text: " - " });

			// Create a span element for the formatted start date in italic style
			paragraph.createSpan({ text: formatDate(createDate(start_date)), attr: { "style": "font-style: italic;" } });

			// Check end date and draw it/warn accordingly
			if (end_date === 'Invalid Date') {
				// Display an error message if the end date is invalid
				paragraph.createSpan({ text: " to " });
				paragraph.createSpan({ text: "Invalid date!", attr: { "style": "font-weight: bold; color: #e8000d;" } });
			}
			else if (end_date) {
				// Create a span element for the "to" text
				paragraph.createSpan({ text: " to " });

				// Create a span element for the formatted end date in italic style
				paragraph.createSpan({ text: formatDate(createDate(end_date)), attr: { "style": "font-style: italic;" } });
			}

			// If there is an image, create an image element and show it
			if (img) {
				paragraph.createEl('img', { attr: { "href": img } })
			}
		});

		this.registerEditorSuggest(new Suggest(this));

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
