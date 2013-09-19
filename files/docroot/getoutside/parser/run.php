#!/usr/bin/php
<?php
require_once 'Parser.php';

try {
	$parser = new Parser('../docs/content.html');
	$parser->save('../www/content.json');
} catch (Exception $e) {
	print $e->getMessage() . PHP_EOL;
}
