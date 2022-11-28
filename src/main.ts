import type { TimelinesSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { TimelinesSettingTab } from './settings';
import { Plugin } from 'obsidian';
import { TimelineView, VIEW_TYPE_TIMELINE } from "./view";
import { parse } from 'yaml'

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
			const container = el.createDiv({cls: "ob-his-timeline-block"})

			console.debug(event);

			let start_date = event.date;
			if (!start_date) {
				container.createEl("p", { text: "Invalid start date!" });
			}

			let end_date = event.end ?? null;
			let title = event.title ?? null;
			let color = event.color ?? "white";
			let img = event.img ?? null;

			// TODO Add color
			if (end_date) {
				container.createEl("i", { text: start_date + " to " + end_date });
			}
			else {
				container.createEl("i", { text: start_date });
			}

			// Encode data to a span for parsing in `view.ts`
			container.createSpan({cls: "ob-his-timeline-block-data" ,
				attr: {
					"start_date": start_date,
					"end_date": end_date,
					"title": title,
					"color": color,
					"img": img,
				}
			});
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
