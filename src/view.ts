import { ItemView, WorkspaceLeaf } from "obsidian";
import TimelinesPlugin from "./main";
import { createDate, getImgUrl } from './utils';
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/esnext";
import "./graph.css";
import { parse } from 'yaml'

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

		// Read all files in the current vault and parse them
		// using a simple regex.
		// Then parse the inner code of the regex and add that as an item
		console.trace("Parsing notes");
		let items = new DataSet([]);
		let groups: any[] = []

		for (let file of fileList) {
			try {
				let note_regex = /```timeline[a-z]*\n[\s\S]*?\n```/g;
				let text = await appVault.read(file);
				let matches = text.match(note_regex);

				if (!matches) {
					continue;
				}

				// Loop through all regex matches
				for (let yaml_unparsed of matches) {
					// Remove first and last line
					yaml_unparsed = yaml_unparsed.substring(yaml_unparsed.indexOf("\n") + 1);
					yaml_unparsed = yaml_unparsed.substring(yaml_unparsed.lastIndexOf("\n") + 1, -1);

					let event = parse(yaml_unparsed);

					// Get all attributes
					let start_date = event.date;
					let end_date = event.end ?? null;
					let title = event.title ?? file.name.slice(0, file.name.length - 3);
					let color = event.color ?? null;
					let group = event.group ?? null;
					console.log(group)
					let type = event.type ?? (Boolean(end_date) ? "range" : "box");
					let img = event.img ?? null;
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
					noteCard.createEl('p', { text: event.innerHTML });

					if (start_date === 'Invalid Date' || start_date == null || start_date == "") {
						console.warn("Event", title, "has an invalid date!")
						continue;
					}

					if ((type === "range" || type === "background") && end_date === 'Invalid Date') {
						console.warn("Event", title, ", which is a background/range, has an invalid end date!")
						continue;
					}

					// Add group data
					if ( groups != null && groups.find(i_group => i_group.content === group))
					{
						groups.push({
							id: groups.length + 1,
							content: group
					
						});
						group = groups.length;
					}

					// Add Event data
					let item = {
						id: items.length + 1,
						content: title,
						title: noteCard.outerHTML,
						className: "timeline-card",
						type: type,
						start: createDate(start_date),
						end: createDate(end_date) ?? null,
						color: color,
						group: group,
					};
					items.add(item);
				}
			} catch (e) {
				console.error(e)
			}
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
			/*template: function (item: any) {
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
			},*/
		};

		// Create a Timeline
		timeline.setAttribute('class', 'timeline-vis');
		el.appendChild(timeline);
		new Timeline(timeline, items, options);
	}

	async onClose() {
		const container = this.containerEl.children[1];
		container.empty();
	}
}
