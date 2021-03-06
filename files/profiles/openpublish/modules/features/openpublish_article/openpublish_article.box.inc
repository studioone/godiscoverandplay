<?php
/**
 * @file
 * openpublish_article.box.inc
 */

/**
 * Implements hook_default_box().
 */
function openpublish_article_default_box() {
  $export = array();

  $box = new stdClass();
  $box->disabled = FALSE; /* Edit this to true to make a default box disabled initially */
  $box->api_version = 1;
  $box->delta = 'ad_300x250_1';
  $box->plugin_key = 'simple';
  $box->title = '';
  $box->description = 'Ad: 300x250';
  $export['ad_300x250_1'] = $box;

  return $export;
}
