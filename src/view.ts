import { ItemView, WorkspaceLeaf } from "obsidian";
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

		let args = {
			startDate: 1000,
			endDate: 2050,
			minDate: -5000,
			maxDate: 5000
		};

		let vaultFiles = this.app.vault.getMarkdownFiles();
		let appVault = this.app.vault;
		let settings = this.plugin.settings;

		// Filter all markdown files to only those containing the tag list
		let fileList = vaultFiles;

		if (!fileList) {
			// if no files valid for timeline
			console.warn("No files to put onto a timeline!");
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
			// Create a DOM Parser
			const domparser = new DOMParser();
			const doc = domparser.parseFromString(await appVault.read(file), 'text/html');
			let timelineData = doc.getElementsByClassName('ob-timelines');
			for (let event of timelineData as any) {
				if (!(event instanceof HTMLElement)) {
					continue;
				}

				let noteId;
				// check if a valid date is specified
				if (event.dataset.date[0] == '-') {
					// if it is a negative year
					noteId = +event.dataset.date.substring(1, event.dataset.date.length).split('-').join('') * -1;
				} else {
					noteId = +event.dataset.date.split('-').join('');
				}
				if (!Number.isInteger(noteId)) {
					continue;
				}
				// if not title is specified use note name
				let noteTitle = event.dataset.title ?? file.name;
				let noteClass = event.dataset.class ?? "";
				let notePath = '/' + file.path;
				let type = event.dataset.type ?? "box";
				let endDate = event.dataset.end ?? null;

				// Min/max end and start date for timeline view
				args.minDate = Math.min(args.minDate, Number(event.dataset.date) )
				args.maxDate = Math.min(args.maxDate, Number(endDate))

				if (!timelineNotes[noteId]) {
					timelineNotes[noteId] = [];
					timelineNotes[noteId][0] = {
						date: event.dataset.date,
						title: noteTitle,
						img: getImgUrl(appVault.adapter, event.dataset.img),
						innerHTML: event.innerHTML,
						path: notePath,
						class: noteClass,
						type: type,
						endDate: endDate
					};
					timelineDates.push(noteId);
				} else {
					let note = {
						date: event.dataset.date,
						title: noteTitle,
						img: getImgUrl(appVault.adapter, event.dataset.img),
						innerHTML: event.innerHTML,
						path: notePath,
						class: noteClass,
						type: type,
						endDate: endDate
					};
					// if note_id already present prepend or append to it
					if (settings.sortDirection) {
						timelineNotes[noteId].unshift(note);
					} else {
						timelineNotes[noteId].push(note);
					}
					console.debug("Repeat date: %o", timelineNotes[noteId]);
				}
			}
		}

		// Sort events based on setting
		console.trace("Sorting events in direction " + settings.sortDirection);
		if (settings.sortDirection) {
			// default is ascending
			timelineDates = timelineDates.sort((d1, d2) => d1 - d2);
		} else {
			// else it is descending
			timelineDates = timelineDates.sort((d1, d2) => d2 - d1);
		}

		// Display timeline based on mode
		console.trace("Displaying timeline in mode ");
		if (false) {
			let eventCount = 0;
			// Build the timeline html element
			for (let date of timelineDates) {
				let noteContainer = timeline.createDiv({ cls: 'timeline-container' });
				let noteHeader = noteContainer.createEl('h2', { text: timelineNotes[date][0].date.replace(/-0*$/g, '').replace(/-0*$/g, '').replace(/-0*$/g, '') });
				let eventContainer = noteContainer.createDiv({ cls: 'timeline-event-list', attr: { 'style': 'display: block' } });

				noteHeader.addEventListener('click', event => {
					if (eventContainer.style.getPropertyValue('display') === 'none') {
						eventContainer.style.setProperty('display', 'block');
						return;
					}
					eventContainer.style.setProperty('display', 'none');
				});

				if (eventCount % 2 == 0) {
					// if its even add it to the left
					noteContainer.addClass('timeline-left');

				} else {
					// else add it to the right
					noteContainer.addClass('timeline-right');
					noteHeader.setAttribute('style', 'text-align: right;');
				}

				if (!timelineNotes[date]) {
					continue;
				}

				for (let eventAtDate of timelineNotes[date]) {
					let noteCard = eventContainer.createDiv({ cls: 'timeline-card' });
					// add an image only if available
					if (eventAtDate.img) {
						noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${eventAtDate.img});` } });
					}
					if (eventAtDate.class) {
						noteCard.addClass(eventAtDate.class);
					}

					noteCard.createEl('article').createEl('h3').createEl('a',
						{
							cls: 'internal-link',
							attr: { href: `${eventAtDate.path}` },
							text: eventAtDate.title
						});
					noteCard.createEl('p', { text: eventAtDate.innerHTML });
				}
				eventCount++;
			}

			// Replace the selected tags with the timeline html
			el.appendChild(timeline);
			return;
		}
		else {
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

					let startDate = event.date?.replace(/(.*)-\d*$/g, '$1');
					let start, end;
					if (startDate[0] == '-') {
						// handle negative year
						let startComp = startDate.substring(1, startDate.length).split('-');
						start = new Date(+`-${startComp[0]}`, +startComp[1], +startComp[2]);
					} else {
						start = new Date(startDate);
					}

					let endDate = event.endDate?.replace(/(.*)-\d*$/g, '$1');
					if (endDate && endDate[0] == '-') {
						// handle negative year
						let endComp = endDate.substring(1, endDate.length).split('-');
						end = new Date(+`-${endComp[0]}`, +endComp[1], +endComp[2]);
					} else {
						end = new Date(endDate);
					}

					if (start.toString() === 'Invalid Date') {
						return;
					}

					if ((event.type === "range" || event.type === "background") && end.toString() === 'Invalid Date') {
						return;
					}

					// Add Event data
					items.add({
						id: items.length + 1,
						content: event.title ?? '',
						title: noteCard.outerHTML,
						start: start,
						className: event.class ?? '',
						type: event.type,
						end: end ?? null
					});
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
				start: createDate(String(args.startDate)),
				end: createDate(String(args.endDate)),
				min: createDate(String(args.minDate)),
				max: createDate(String(args.maxDate))
			};

			// Create a Timeline
			timeline.setAttribute('class', 'timeline-vis');
			new Timeline(timeline, items, options);

			// Replace the selected tags with the timeline html
			el.appendChild(timeline);
		}
	}

	async onClose() {
		const container = this.containerEl.children[1];
		container.empty();
	}
}