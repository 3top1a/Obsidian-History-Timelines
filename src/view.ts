import { ItemView, WorkspaceLeaf, MarkdownRenderer, Component, MarkdownPostProcessorContext } from "obsidian";
import TimelinesPlugin from "./main";
import { Modal, App } from 'obsidian';
import { createDate, getImgUrl } from './utils';
import type { TimelinesSettings, AllNotesData } from './types';
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/esnext";
import "./graph.css";

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
		let timelineNotes = [] as AllNotesData;
		let timelineDates = [];

		// Parse notes for dates
		console.trace("Parsing notes for dates");
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

				let noteId;
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
				let img = get_named_item_or_null("img") ?? null;

				// check if a valid date is specified
				if (start_date[0] == '-') {
					// if it is a negative year
					noteId = +start_date.substring(1, start_date.length).split('-').join('') * -1;
				} else {
					noteId = +start_date.split('-').join('');
				}
				if (!Number.isInteger(noteId)) {
					continue;
				}

				if (!timelineNotes[noteId]) {
					timelineNotes[noteId] = [];
					timelineNotes[noteId][0] = {
						date: start_date,
						title: title,
						img: getImgUrl(appVault.adapter, img),
						innerHTML: eventSpan.innerHTML,
						path: '/' + file.path,
						class: "timeline-card", // noteClass
						type: "range", // `box` as default
						endDate: end_date,
					};
					timelineDates.push(noteId);
					console.log(timelineNotes[noteId][0]);
				} else {
					let note = {
						date: start_date,
						title: title,
						img: getImgUrl(appVault.adapter, img),
						innerHTML: eventSpan.innerHTML,
						path: '/' + file.path,
						class: "timeline-card",
						type: "range",
						endDate: end_date
					};

					console.log(note);

					timelineNotes[noteId].push(note);
				}
			}

			subcontainer.remove();
		}

		// If no events found, replace with error
		if (timelineDates.length == 0) {
			console.warn("No events to put onto a timeline!");
			container.createEl("h5", { text: "No events found!" });
			return;
		}

		// Create a DataSet
		let items = new DataSet([]);

		timelineDates.forEach(date => {

			// add all events at this date
			Object.values(timelineNotes[date]).forEach(event => {
				// Create Event Card
				let noteCard = document.createElement('div');
				noteCard.className = 'timeline-card';

				// add an image only if available
				if (event.img) {
					noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${event.img});` } });
				}
				if (event.class) {
					noteCard.addClass(event.class);
				}

				noteCard.createEl('article').createEl('h3').createEl('a', {
					cls: 'internal-link',
					attr: { href: `${event.path}` },
					text: event.title
				});
				noteCard.createEl('p', { text: event.innerHTML });

				if (event.date === 'Invalid Date') {
					return;
				}

				if ((event.type === "range" || event.type === "background") && event.endDate === 'Invalid Date') {
					return;
				}

				// Add Event data
				let item = {
					id: items.length + 1,
					content: event.title ?? '',
					title: noteCard.outerHTML,
					className: event.class ?? '',
					type: event.type,
					start: createDate(event.date),
					end: createDate(event.endDate) ?? null
				};
				items.add(item);
			});
		});

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
