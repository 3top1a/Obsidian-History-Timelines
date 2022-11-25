//import Gallery from './svelte/Gallery.svelte'
import type { TimelinesSettings, AllNotesData } from './types';
import { RENDER_TIMELINE } from './constants';
import type { TFile, MarkdownView, MetadataCache, Vault } from 'obsidian';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { FilterMDFiles, createDate, getImgUrl, parseTag } from './utils';

export class TimelineProcessor {

}
