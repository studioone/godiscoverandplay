<?php

/**
 * @file
 * Theme implementation to display advpoll choice form with image fields.
 *
 * - TODO: $nid: The nid of the advpoll. Needs to be set in form.
 * - TODO: $title: The title of the advpoll. Needs to be set in form (or grabbed from nid in preprocess).
 * - $choices: The radio buttons or checkboxes for the choices in the advpoll.
 * - $images: The choice images, with keys corresponding to $choices. These can be themed via theme_advpoll_field_image_image().
 * - $write_in: The write-in field, if it is set.
 * - $message: Poll message (validation error, etc.), if set.
 * - $submit: The vote button.
 * - $hidden: Hidden variables that need to be rendered for the form to function.
 *
 * @see
 * - template_preprocess_advpoll_field_image_choice_form()
 * - theme_advpoll_field_image_image().
 *
 * @ingroup themeable
 */
?>

<div class="poll advpoll">
  <div class="advpoll-choice-form advpoll-field-image-choice-form">

    <div class="choices">
      <span class="vs-image"></span>
      <?php foreach ($choices as $key => $choice) { ?>
        <div class="choice choice-<?php print $key ?>">
          <?php if (!empty($images)): ?>
            <div class="choice-image"><?php print $images[$key]?></div>
          <?php endif; ?>
          <div class="choice-text"><?php print $choice; ?></div>
        </div>
      <?php } ?>

      <?php if (isset($write_in)): ?>
        <?php print $write_in; ?>
      <?php endif; ?>
    </div>

  <?php if (isset($message)): ?>
    <?php print $message; ?>
  <?php endif; ?>

  <?php print $submit; ?>
  <?php print $hidden; ?>
  </div>
</div>