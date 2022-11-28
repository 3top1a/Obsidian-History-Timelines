import { ItemView, WorkspaceLeaf, MarkdownRenderer, Component, MarkdownPostProcessorContext } from "obsidian";
import TimelinesPlugin from "./main";
import { Modal, App } from 'obsidian';
import { createDate, getImgUrl } from './utils';
import type { TimelinesSettings, AllNotesData } from './types';
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/esnext";
import "./graph.css";
import Parallel from 'paralleljs';

export const VIEW_TYPE_TIMELINE = "timeline-history-view";

export class TimelineView extends ItemView {
	plugin: TimelinesPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: TimelinesPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText() {
		return "History Timeline";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h3", { text: "History Timelines" });
		const el = this.contentEl;

		let vaultFiles = this.app.vault.getMarkdownFiles();
		let appVault = this.app.vault;
		let settings = this.plugin.settings;

		// Filter all markdown files to only those containing the tag list
		let fileList = vaultFiles;

		if (!fileList) {
			// if no files valid for timeline
			console.warn("No files to put onto a timeline!");
			container.createEl("h5", { text: "No files found!" });
			return;
		}

		// Keep only the files that have the time info
		let timeline = document.createElement('div');
		timeline.setAttribute('class', 'timeline');

		// Create a DataSet
		console.trace("Parsing notes");
		let items = new DataSet([]);

		for (let file of fileList) {
			// Render note to HTML and parse it
			let subcontainer = el.createSpan();
			await MarkdownRenderer.renderMarkdown(await appVault.read(file), subcontainer, file.path, null);
			let timelineData = subcontainer.getElementsByClassName('ob-his-timeline-block-data');

			// Loop through all spans with class `ob-his-timeline-block-data`
			for (let eventSpan of timelineData as any) {
				if (!(eventSpan instanceof HTMLElement)) {
					continue;
				}

				// Get all attributes
				function get_named_item_or_null(name: string): any {
					let temp = eventSpan.attributes.getNamedItem(name);
					if (temp === null) {
						return null;
					}
					else {
						return temp.value ?? null;
					}
				}
				let start_date = get_named_item_or_null("start_date");
				let end_date = get_named_item_or_null("end_date") ?? null;
				let title = get_named_item_or_null("title") ?? file.name.slice(0, file.name.length - 3);
				let color = get_named_item_or_null("color") ?? null;
				let type = get_named_item_or_null("type") ?? (Boolean(end_date) ? "range" : "box" );
				let img = get_named_item_or_null("img") ?? null;
				let path = '/' + file.path;

				// Create Event Card
				let noteCard = document.createElement('div');
				noteCard.className = 'timeline-card';

				// add an image only if available
				if (img) {
					noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${img});` } });
				}

				noteCard.createEl('article').createEl('h3').createEl('a', {
					cls: 'internal-link',
					attr: { href: `${path}` },
					text: title
				});
				noteCard.createEl('p', { text: eventSpan.innerHTML });

				if (start_date === 'Invalid Date') {
					console.error("Event", title, "has an invalid date!")
					return;
				}

				if ((type === "range" || type === "background") && end_date === 'Invalid Date') {
					console.error("Event", title, ", which is a period/range, has an invalid end date!")
					return;
				}

				// Add Event data
				let item = {
					id: items.length + 1,
					content: title,
					title: noteCard.outerHTML,
					className: "timeline-card",
					type: type,
					start: createDate(start_date),
					end: createDate(end_date) ?? null
				};
				items.add(item);
			}
			subcontainer.empty();
			subcontainer.remove();
		}

		// If no events found, replace with error
		if (items.length == 0) {
			console.warn("No events to put onto a timeline!");
			container.createEl("h5", { text: "No events found!" });
			return;
		}

		// Configuration for the Timeline
		let options = {
			minHeight: '99%',
			showCurrentTime: false,
			showTooltips: false,
			template: function (item: any) {
				let eventContainer = document.createElement('div');
				eventContainer.setText(item.content);
				let eventCard = eventContainer.createDiv();
				eventCard.outerHTML = item.title;

				eventContainer.addEventListener('click', event => {
					let el = (eventContainer.getElementsByClassName('timeline-card')[0] as HTMLElement);
					el.style.setProperty('display', 'block');
					el.style.setProperty('top', `-${el.clientHeight + 10}px`);
				});

				// Double click to open (ctrl for new tab)
				// TODO
				eventContainer.addEventListener('doubleClick', event => {
					let el = (eventContainer.getElementsByClassName('timeline-card')[0] as HTMLElement);
				});

				return eventContainer;
			},
		};

		// Create a Timeline
		timeline.setAttribute('class', 'timeline-vis');
		new Timeline(timeline, items, options);

		// Replace the selected tags with the timeline html
		el.appendChild(timeline);
	}

	async onClose() {
		const container = this.containerEl.children[1];
		container.empty();
	}
}
