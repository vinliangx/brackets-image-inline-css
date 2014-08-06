define(function (require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        AppInit = brackets.getModule("utils/AppInit"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils");


    // Function to run when the menu item is clicked
    function fileToInlineBase64(file) {
        useBase64ForImageUrl(file, function(data){
            var editor = brackets.getModule("editor/EditorManager").getFocusedEditor();
            if (editor) {
                var insertionPos = editor.getCursorPos();
                var line = editor.document.getLine(insertionPos.line);
                //Reg Ex
                line = line.replace(/url\(.*?\)/g, 'url(\'' + data + '\')');
                editor.document.replaceRange(line, {line:insertionPos.line, ch:0}, {line:insertionPos.line, ch:line.length});
            }
        });
    }
    
    function extractImageFile(){
        var editor = brackets.getModule("editor/EditorManager").getFocusedEditor();
        if (editor) {
            var insertionPos = editor.getCursorPos();
            var line = editor.document.getLine(insertionPos.line);
            //Reg Ex
            var matches = line.match(/url\(.*?\)/g);
            matches.forEach(function (match){
                var image = match.replace(/(url)|([\(\)'"])/g,'');
                fileToInlineBase64(resolvePath(image));
            });
        }
    }
    
    function resolvePath(image){
        var document = brackets.getModule("editor/EditorManager").getFocusedEditor().document;
        // Path of Assuming CSS document 
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
    var VR_BASE64_IMAGE_COMMAND_ID = "com.vinrosa.base64image.insertimage";
    CommandManager.register("Image 2 inline CSS", VR_BASE64_IMAGE_COMMAND_ID, extractImageFile);
    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    contextMenu.addMenuItem(VR_BASE64_IMAGE_COMMAND_ID);
});
