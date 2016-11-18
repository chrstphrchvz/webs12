#!/usr/bin/perl -wT
# cPanel Perl environment/modules
use cPanelUserConfig;

# cf. https://www.sitepoint.com/uploading-files-cgi-perl-2/
#use CGI::Debug;
use strict;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );

# cf. http://perlmaven.com/json
#use JSON::MaybeXS ':all'; # MaybeXS is not available on host-ed
use JSON::PP;
# use HSW12ASM module directly
# can place e.g. in ~/perl/usr/local/share/perl5
require hsw12_asm;

# limit upload to 5MB
$CGI::POST_MAX = 1024 * 5000;

use constant INCLUDE_PATH => '../include/';
my $prog_name = "WebS12";
my $srec_format = 'S19';
my $srec_data_length = 32;
my $srec_add_s5 = $hsw12_asm::srec_def_add_s5;
my $srec_word_entries = 1;

my $query = new CGI;
my $upload_filehandle = $query->upload("fileupload");

# cf. http://search.cpan.org/~leejo/CGI-4.35/lib/CGI.pod#PROCESSING_A_FILE_UPLOAD_FIELD
my $code = hsw12_asm->new(
					[$query->tmpFileName($upload_filehandle)],
					[INCLUDE_PATH], {}, "S12", 0);

my $json_data = {
    asmMessages => $code->print_mem_alloc(),
    listFile => $code->print_listing(),
    SRecordFile => $code->print_pag_srec(uc($prog_name),
					    $srec_format,
					    $srec_data_length,
					    $srec_add_s5,
					    $srec_word_entries),
};

print $query->header("application/json");
print encode_json $json_data;
