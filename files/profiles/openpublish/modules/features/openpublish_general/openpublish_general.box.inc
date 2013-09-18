<?php
/**
 * @file
 * openpublish_general.box.inc
 */

/**
 * Implements hook_default_box().
 */
function openpublish_general_default_box() {
  $export = array();

  $box = new stdClass();
  $box->disabled = FALSE; /* Edit this to true to make a default box disabled initially */
  $box->api_version = 1;
  $box->delta = 'ad_728x90_1';
  $box->plugin_key = 'simple';
  $box->title = '';
  $box->description = 'Ad: 728x90 Bottom';
  $export['ad_728x90_1'] = $box;

  return $export;
}
