#use constant INCLUDE_PATH => '../include/';
my $prog_name = "WebS12";
my $srec_format = 'S19';
my $srec_data_length = 32;
my $srec_add_s5 = $hsw12_asm::srec_def_add_s5;
my $srec_word_entries = 1;

my $asm_string = js('editor')->methodcall('getValue');

=pod

# TODO: make sure that Unicode or other unusual input is either filtered
# or properly handled.

# Is this right? Since open() expects in-memory string to be octets,
# goal is to convert $asm_string in-place (i.e. without copying)
# to octets and pass it to open() with appropriate internal encoding
# (no idea whether HSW12ASM actually works with Unicode in input,
# but don't see why not)
utf8::encode($asm_string);

# No good -- need filename, not handle
open(my $asm_filehandle, '<:encoding(utf8)', \$asm_string);

# Also need to decode results before sending to js

=cut

my $asm_file = File::Temp->new(
	UNLINK => 1,
	SUFFIX => '.asm',
);
print $asm_file $asm_string;
close $asm_file;

my $code = hsw12_asm->new(
	[$asm_file->filename],
	#[INCLUDE_PATH],
	[],
	{},
	"S12",
	0,
);

js('window')->{'SRecordFile'} = js_new(
	'String',
	'SRecordFile',
	$code->print_pag_srec(
		uc($prog_name),
		$srec_format,
		$srec_data_length,
		$srec_add_s5,
		$srec_word_entries,
	),
);
js('listFile')->methodcall('setValue', $code->print_listing(), -1);
js('asmMessages')->methodcall('setValue', $code->print_mem_alloc(), -1);

1;
