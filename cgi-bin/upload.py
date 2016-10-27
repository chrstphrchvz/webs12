#!/usr/bin/python

# cf. https://docs.python.org/2/library/cgi.html
# cf. http://stackoverflow.com/a/4369166/4896937
# cf. http://www.tutorialspoint.com/python/python_cgi_programming.htm

import cgi
import cgitb
cgitb.enable() # for debugging
import os
import subprocess

PERL_CMD = 'perl'
HSW12ASM_PATH = 'HSW12/Perl/hsw12asm.pl'
INCLUDE_PATH = '../include/'
UPLOAD_PATH = '../uploads/'
SREC_SUFFIX = '_pag.s19'
LST_SUFFIX = '.lst'
print "Content-Type: text/html"     # HTML is following
print                               # blank line, end of headers

print """
<html>
<head>
<title>HSW12 Assembler results</title>
</head>
<body>
<center>
<h1>HSW12 Assembler</h1>
</center>
""",

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
    # print command output
    print """
    <h2>HSW12ASM output:</h2>
    <p><pre><code>%s</code></pre></p>
    """ % cgi.escape(hsw12_output),
    # print list file
    print """
    <h2>List file:</h2>
    <p><pre><code>%s</code></pre></p>
    """ % cgi.escape(open(UPLOAD_PATH + fn + LST_SUFFIX).read()).replace('\n', '<br />'),
    # print link to paged S record file
    print """
    <h2><a href ="%s">Download paged S-Record file</a></h2>
    """ % cgi.escape(UPLOAD_PATH + fn + SREC_SUFFIX),



print """<p><a href="../hsw12asm.html"> Go back to form</a></p>
</body>
</html>
""",