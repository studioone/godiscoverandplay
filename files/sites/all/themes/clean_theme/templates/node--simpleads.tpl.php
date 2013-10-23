<div class="node-simpleads">
<?php 
global $base_url;
$url=$base_url.'/simpleads/redirect/'.$node->nid;
$node=node_load($node->nid);
$img_url=file_create_url($node->field_ad_image[LANGUAGE_NONE][0][uri]);
$image_info=image_get_info($node->field_ad_image[LANGUAGE_NONE][0][uri]);
if($node->field_ad_category[LANGUAGE_NONE][0]['tid']==4){
	$width='260';
	
}
else
	$width=$image_info['width'];
$height=$image_info['height'];
?>
<a href="<?php print $url;?>" target="_blank">
<?php 
if($node->field_ad_category[LANGUAGE_NONE][0]['tid']==5){
?>

<img class="belazy"  data-original="<?php print $img_url;?>" width="<?php print $width;?>" height="<?php print $height;?>" />
<?php 
}
else{
?>
<img  src="<?php print $img_url;?>" style="width:100%" />
<?php 
	simpleads_simpleads_ad_impression('insert', $node);
}
?>
</a>
<input type="hidden" class="nid-val" value="<?php print $node->nid;?>">
<?php 
global $user;
if(in_array('administrator', $user->roles)){
	print l("Ad Statistics","node/".$node->nid."/stat");
}
?>
</div>