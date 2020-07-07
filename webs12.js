/*
 * For handling unsaved changes, a few mechanisms are used:
 * 1. window.onbeforeunload is set to a function that
 *    checks if there are "unsaved changes" using isClean();
 * 2. functions for new/open Asm file check if document
 *    has changed, and if so will prompt using confirm();
 *    they then markClean() the editor.
 * The isClean() and markClean() are documented as undocumented.
 *
 * References:
 * https://stackoverflow.com/a/1119324/4896937 (K. Henry)
 * https://stackoverflow.com/a/19717243/4896937 (anonymous "A User")
 * https://github.com/ajaxorg/ace/issues/324#issuecomment-60917355 (H. Amirjanyan)
 * https://github.com/ajaxorg/ace/issues/324#issuecomment-151274762 (GitHub user vanillajonathan)
 */ 

/*
 * Load WebPerl, eval webs12init.pl script, eval HSW12ASM module,
 * and have webS12asm.pl script ready to eval
 */
webs12init_fetch = fetch('webs12init.pl');
hsw12asm_fetch = fetch('https://cdn.jsdelivr.net/gh/hotwolf/HSW12/Perl/hsw12_asm.pm');
webs12asm_fetch = fetch('webs12asm.pl');
var webs12asm_pl;
// TODO: make this look like a promise chain?
Perl.init(function () {
	Perl.start([]);
	webs12init_fetch.then(function (response) {
		response.text().then(function (text) {
			// Eval the init script
			Perl.eval(text);
			hsw12asm_fetch.then(function (response){
				response.text().then(function(text){
					// equivalent of 'require hsw12_asm'
					Perl.eval(text);
					webs12asm_fetch.then(function (response){
						response.text().then(function(text) {
							webs12asm_pl = text;
							document.getElementById('runAsmButton').disabled = false;
							document.getElementById('runAsmButton').textContent = 'Run assembler';
						});
					});
				});
			});
		});
	});
});


var editor = ace.edit("editor");
var unsavedMessage = 'Proceed without saving changes?';
// adapted/copied from https://stackoverflow.com/a/1119324/4896937 (K. Henry)
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

var SRecordFile = new String("");

var asmMessages = ace.edit("asmMessages");
asmMessages.setReadOnly(true);
var listFile = ace.edit("listFile");
listFile.setReadOnly(true);

//editor.setTheme("ace/theme/monokai");
//editor.getSession().setMode("ace/mode/javascript");

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
			// cf. https://stackoverflow.com/a/12102992/4896937
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
	document.getElementById('runAsmButton').disabled = true;
	document.getElementById('downloadSRecFileButton').disabled = true;
	document.getElementById('runAsmButton').textContent = 'Assembler is running…'
	Perl.eval(webs12asm_pl);
	document.getElementById('runAsmButton').textContent = 'Run assembler'
	document.getElementById('runAsmButton').disabled = false;
	document.getElementById('downloadSRecFileButton').disabled = false;
}

/*
 * copied from https://stackoverflow.com/a/18197341/4896937 (Pokorný, Flaschen, et al.) 
 * (creates an <a href="..."></a> element, clicks it, then deletes it.)
 * 
 * NOTE: using FileSaver.js would be better in order to replicate
 * "Save As" functionality in desktop program
 */
function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute(
		'href',
		'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
	);
	element.setAttribute('download', filename);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function saveAsmFile(event) {
	download('myprogram.asm', editor.getValue());
	editor.session.getUndoManager().markClean();
}

if ('serial' in navigator) {
	document.getElementById('connectBoardButton').disabled = false;
}

// TODO: use async+await and const as appropriate

async function doConnectToBoard(event) {
	port = await navigator.serial.requestPort();
	await port.open({ baudrate: 9600 });
	portWriter = port.writable.getWriter();
	onData_IDisposable = term.onData((data) => {
		// make backspace key work like ^H
		const data2 = data.replace(/\x7f/g, '\b');
		const encoder = new TextEncoder();
		portWriter.write(encoder.encode(data2));
	});
	port.readable.pipeTo(termInputAdapter);
	document.getElementById('connectBoardButton').onclick = doDisconnectFromBoard;
	document.getElementById('connectBoardButton').textContent = 'Disconnect from board';
	document.getElementById('downloadSRecBoardButton').disabled = false;
}

function doDisconnectFromBoard(event) {

	// Stop writing terminal output to port
	onData_IDisposable.dispose();
	onData_IDisposable = undefined;

	// Unfinished: need to "tear down" pipe here?

	document.getElementById('connectBoardButton').onclick = doConnectToBoard;
	document.getElementById('connectBoardButton').textContent = 'Connect to board';
	document.getElementById('downloadSRecBoardButton').disabled = true;
}

function doBoardDownload(event) {
	const encoder = new TextEncoder();
	portWriter.write(encoder.encode(SRecordFile.valueOf()));
}

var port;
var portWriter;
var onData_IDisposable;

var term = new Terminal();
term.open(document.getElementById('terminal'));

var termInputAdapter = new WritableStream({
	write(chunk, controller) {
		return new Promise((resolve, reject) => {
			term.writeUtf8(chunk);
			resolve();
		});
	},
});
