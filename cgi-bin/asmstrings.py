#!/usr/bin/python
# cf. http://www.willmaster.com/library/tutorials/javascript-and-cgi-talking-to-each-other.php
# cf. http://stackoverflow.com/a/17118733
import cgi
import cgitb
cgitb.enable() # for debugging
import os
import subprocess
import json

PERL_CMD = 'perl'
HSW12ASM_PATH = 'HSW12/Perl/hsw12asm.pl'
INCLUDE_PATH = '../include/'
UPLOAD_PATH = '../uploads/'
SREC_SUFFIX = '_pag.s19'
LST_SUFFIX = '.lst'
print "Content-Type: text/javascript" # return assembler output as js strings
print                               # blank line, end of headers

form = cgi.FieldStorage()
fileitem = form["fileupload"]
# Test if the file was uploaded
if fileitem.filename:
    asm = fileitem.file.read()
    # strip leading path from file name to avoid 
    # directory traversal attacks
    fn = os.path.basename(fileitem.filename)
    open(UPLOAD_PATH + fn, 'wb').write(asm)
    
    # run assembler
    hsw12_output = subprocess.check_output(
        ['perl', HSW12ASM_PATH, UPLOAD_PATH + fn, '-L', INCLUDE_PATH, '-S19'],
        stderr=subprocess.STDOUT)
    # return command output
    print """
    asmMessages = %s;
    """ % json.dumps(hsw12_output),
    # return list file
    print """
    listFile = %s;
    """ % json.dumps(open(UPLOAD_PATH + fn + LST_SUFFIX).read()),
    # return S record file
    print """
    SRecordFile = %s;
    """ % json.dumps(open(UPLOAD_PATH + fn + SREC_SUFFIX).read()),

