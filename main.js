/*global brackets, console, define*/

define(function (require, exports, module) {
    "use strict";
    var
        VR_BASE64_IMAGE_COMMAND_ID = "com.vinrosa.base64image.insertimage",

        CSS_URL = {
            selector: new RegExp('url\\(.*?\\)', 'g'),
            clear: new RegExp('(url)|([\\(\\)\'"])', 'g')
        },
        HTML_IMG = {
            selector: new RegExp('(<img .*?>+)', 'gi'),
            clear: new RegExp('(<img .*?((src=)["\'])|["\'](.*)>+)', 'g')
        },

        REGEXS = [CSS_URL, HTML_IMG],

        REGEX_HTTP = /^(f|ht)tps?:\/\//i,

        Menus = brackets.getModule("command/Menus"),
        CommandManager = brackets.getModule("command/CommandManager"),
        AppInit = brackets.getModule("utils/AppInit"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        EditorManager = brackets.getModule("editor/EditorManager"),


        contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

    function useBase64ForImageUrl(URL, callback) {
        var canvas = document.createElement("canvas"),
            img = new Image();
        img.src = URL;
        img.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext("2d"),
                data = null;
            ctx.drawImage(this, 0, 0);
            data = canvas.toDataURL("image/jpg");
            callback(data);
        };
    }

    function fileToInlineBase64(file, regex) {
        useBase64ForImageUrl(file, function (data) {
            var editor = EditorManager.getFocusedEditor(),
                insertionPos = editor.getCursorPos(),
                line = editor.document.getLine(insertionPos.line),
                matches = line.match(regex.selector);
            if (matches) {
                matches.forEach(function (match) {
                    var filename = match.replace(regex.clear, '');
                    line = line.replace(filename, data);
                    editor.document.replaceRange(line, {
                        line: insertionPos.line,
                        ch: 0
                    }, {
                        line: insertionPos.line,
                        ch: line.length
                    });
                });
            }
        });
    }

    function resolvePath(image) {
        if (REGEX_HTTP.test(image)) {
            return image;
        }
        var document = EditorManager.getFocusedEditor().document,
            path = FileUtils.getDirectoryPath(document.file.fullPath) + image;
        return path;
    }


    function extractImageFile() {
        var editor = EditorManager.getFocusedEditor(),
            insertionPos = editor.getCursorPos(),
            line = editor.document.getLine(insertionPos.line);
        REGEXS.some(function (regex) {
            console.log(regex);
            var matches = line.match(regex.selector);
            console.log(matches);
            if (matches) {
                matches.forEach(function (match) {
                    var image = match.replace(regex.clear, '');
                    fileToInlineBase64(resolvePath(image), regex);
                });
                return true;
            }
            return false;
        });
    }


    CommandManager.register("Use Data Uri", VR_BASE64_IMAGE_COMMAND_ID, extractImageFile);

    contextMenu.addMenuItem(VR_BASE64_IMAGE_COMMAND_ID);
});