import {
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile
} from "obsidian";
import TimelinesPlugin from "./main";
import { keywords } from "./constants";


export class Suggest extends EditorSuggest<string> {
    constructor(public plugin: TimelinesPlugin) {
        super(plugin.app);
    }

    getSuggestions(ctx: EditorSuggestContext) {
        return keywords.filter((str) => str.contains(ctx.query));
    }

    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if (this.context) {
            let editor = this.context.editor as Editor;

            // TODO remove start from value

            editor.replaceRange(value + ": ", this.context.start, this.context.end);
            editor.setCursor(
                this.context.start.line,
                this.context.start.ch + value.length + 2
            );
        }
    }

    renderSuggestion(text: string, el: HTMLElement) {
        el.createSpan({ text });
    }

    onTrigger(
        cursor: EditorPosition,
        _editor: Editor,
        file: TFile
    ): EditorSuggestTriggerInfo {
        // Skip if the line has a :
        if (_editor.getValue().split('\n')[cursor.line].contains(':')) {
            return null;
        }

        if (isInCodeBlock(_editor.getValue(), cursor)) {
            const line = _editor.getLine(cursor.line);
            const matchData = {
                end: cursor,
                start: cursor,
                query: line
            };

            return matchData;
        }
        return null;
    }
}

function isInCodeBlock(text: string, cursor: any) {
    const codeBlockRegex = /```[a-z]*\n[\s\S]*?\n```/g;
    const { line, ch } = cursor;

    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const codeBlockContent = match[0];
        const codeBlockLines = codeBlockContent.split(/\r?\n/);

        const codeBlockStartLine = text.substring(0, match.index).split(/\r?\n/).length - 1;
        const codeBlockEndLine = codeBlockStartLine + codeBlockLines.length - 1;

        if (line >= codeBlockStartLine && line <= codeBlockEndLine) {
            if (line === codeBlockEndLine) {
                // Cursor is in the last line of the code block
                return ch <= codeBlockLines[line - codeBlockStartLine].length;
            } else {
                // Cursor is in a line within the code block, but not the last line
                return true;
            }
        }
    }

    return false;
}

