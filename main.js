define(function (require, exports, module) {
    "use strict";

    var REGEX_CSS_URL = /url\(.*?\)/g;
    var REGEX_CSS_URL_CLEAR = /(url)|([\(\)'"])/g;
    var REGEX_HTML_IMG = /(<img .*?>+)/gi;
    var REGEX_HTML_IMG_CLEAR = /(<img .*?((src=)["'])|["'](.*)>+)/g;
    var REGEX_HTTP = /^(f|ht)tps?:\/\//i;

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        AppInit = brackets.getModule("utils/AppInit"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        EditorManager = brackets.getModule("editor/EditorManager");

    function fileToInlineBase64(file, regex) {
        useBase64ForImageUrl(file, function (data) {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                var insertionPos = editor.getCursorPos();
                var line = editor.document.getLine(insertionPos.line);
                //Reg Ex
                var matches = line.match(regex.selector);
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
            }
        });
    }

    function resolvePath(image) {
        if (REGEX_HTTP.test(image)) {
            return image;
        }
        var document = EditorManager.getFocusedEditor().document;
        var path = FileUtils.getDirectoryPath(document.file.fullPath) + image;
        return path;
    }

    function useBase64ForImageUrl(URL, callback) {
        var canvas = document.createElement("canvas");
        var img = new Image();
        img.src = URL;
        img.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            var data = canvas.toDataURL("image/png");
            callback(data);
        }
    }

    function extractImageFile() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var insertionPos = editor.getCursorPos();
            var line = editor.document.getLine(insertionPos.line);
            //Reg Ex
            var regexs = [{
                selector: REGEX_CSS_URL,
                clear: REGEX_CSS_URL_CLEAR
            }, {
                selector: REGEX_HTML_IMG,
                clear: REGEX_HTML_IMG_CLEAR
            }];

            regexs.some(function (regex) {
                var matches = line.match(regex.selector);
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
    }

    var VR_BASE64_IMAGE_COMMAND_ID = "com.vinrosa.base64image.insertimage";
    CommandManager.register("Use Data Uri", VR_BASE64_IMAGE_COMMAND_ID, extractImageFile);
    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    contextMenu.addMenuItem(VR_BASE64_IMAGE_COMMAND_ID);
});
