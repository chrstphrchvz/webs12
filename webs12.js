/* For handling unsaved changes, a few mechanisms are used:
 * 1. window.onbeforeunload is set to a function that
 *    checks if there are "unsaved changes" using isClean();
 * 2. functions for new/open Asm file check if document
 *    has changed, and if so will prompt using confirm();
 *    they then markClean() the editor.
 * The isClean() and markClean() are documented as undocumented.
 *
 * References:
 * http://stackoverflow.com/a/1119324 (K. Henry)
 * http://stackoverflow.com/a/19717243 (anonymous "A User")
 * https://github.com/ajaxorg/ace/issues/324#issuecomment-60917355 (H. Amirjanyan)
 * https://github.com/ajaxorg/ace/issues/324#issuecomment-151274762 (GitHub user vanillajonathan)
 */ 


var editor = ace.edit("editor");
var unsavedMessage = 'Proceed without saving changes?';
// adapted/copied from http://stackoverflow.com/a/1119324 (K. Henry)
window.onbeforeunload = function (e) 
{
    // If we haven't been passed the event get the window.event
    e = e || window.event;
    
    // check for unsaved changes
    if (!editor.session.getUndoManager().isClean())
    {
        // For IE6-8 and Firefox prior to version 4
        if (e) 
        {
            e.returnValue = unsavedMessage;
        }

        // For Chrome, Safari, IE8+ and Opera 12+
        return unsavedMessage;
    }
    else
    {
        return null;
    }
};	
function checkUnsavedChanges(){
    var clean = editor.session.getUndoManager().isClean();
    var confirmed = false;		
    if(!clean)
    {
        confirmed = confirm(unsavedMessage);
    }
    return clean || confirmed;
}

var SRecordFile = "";

var asmMessages = ace.edit("asmMessages");
asmMessages.setReadOnly(true);
var listFile = ace.edit("listFile");
listFile.setReadOnly(true);

//editor.setTheme("ace/theme/monokai");
//editor.getSession().setMode("ace/mode/javascript");
/*
$(document).ready(function(){
    compilerflasher = new compilerflasher(function () {return []});
});
*/


// cf. https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload
function openAsmFile(event) {
    if (checkUnsavedChanges()) {
        var asmFile = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function(event){
            // don't select text
            // cf. https://github.com/ajaxorg/ace/issues/1485
            editor.setValue(event.target.result, -1);	
            editor.session.getUndoManager().markClean();	
            // workaround input onchange event not firing when same file is selected
            // cf. http://stackoverflow.com/a/12102992
            document.getElementById('input').value = null;
        };
        reader.readAsText(asmFile);								
    }
}
function newAsmFile(event) {
    if (checkUnsavedChanges()) {
        editor.setValue("", -1);
        editor.session.getUndoManager().markClean();
    }
}
function runAssembler(event) {
    // cf. http://stackoverflow.com/a/22858914
    var formData = new FormData();
    var blob = new Blob([editor.getValue()], {type: 'plain/text'});
    formData.append('fileupload', blob, "s12edit.asm");
    // cf. https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetch("https://webs12.host-ed.me/cgi-bin/asmstrings.pl", {
        method: "POST",
        body: formData
    }).then(function(response) {
        var contentType = response.headers.get("content-type");
        if(contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function(json) {
                SRecordFile = json.SRecordFile;
                listFile.setValue(json.listFile, -1);
                asmMessages.setValue(json.asmMessages, -1);
            });
        } else {
            console.log("Oops, we haven't got JSON!");
        }
    });
}
// copied from http://stackoverflow.com/a/18197341 (Pokorný, Flaschen, et al.) 
// (creates an <a href="..."></a> element, clicks it, then deletes it.)
// NOTE: using FileSaver.js would be better in order to replicate "Save As" functionality in desktop program
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
function saveAsmFile(event) {
    download('myprogram.asm',editor.getValue());
    editor.session.getUndoManager().markClean();
}
