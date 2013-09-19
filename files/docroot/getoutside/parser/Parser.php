<?php

require_once 'simple_html_dom.php';

/**
 * Parse converted html content from odt file into a json file to be used on the app
 *
 * @author Darkunz
 */
class Parser
{

	/**
	 * @var String
	 */
	private $_file;

	/**
	 * @param String $file
	 */
	public function __construct($file)
	{
		if (!file_exists($file)) throw new Exception('File not found!');

		$this->_file = $file;
	}

	/**
	 * Save parsed json content to the specified location
	 * 
	 * @param String $location 
	 */
	public function save($location = 'content.json')
	{
		$html = file_get_html($this->_file);

		$results = array();

		foreach ($html->find('p') as $city) {

			$items = array();

			$cityName = $this->cleanCityName( $city->text() );
			
			$currentEl = $city;

			$activityName = null;

			// loop through each sibling unless its a <p> tag
			while ( ($currentEl = $currentEl->next_sibling()) ) {

				// check if another city
				if ($currentEl->tag == 'p')
					break;

				// check if activity container
				if ($currentEl->tag == 'ul') {
					$currentEl->find('span', 0)->clear();
					$activityName = $currentEl->plaintext;
					$activityName = $this->clean($activityName);

					if ($activityName == 'Strength Training')
						$activityName = 'Strength';

					if (!$activityName) throw new Exception('Activity name not found!');
				}
				
				// check if content container
				if ($currentEl->tag == 'ol') {
					foreach ($currentEl->find('li') as $content) {
						// remove ordered list number
						$content->find('span', 0)->innertext = '';
						$text = $this->clean( $content->plaintext );

						$links = array();

						foreach ($content->find('a') as $link) {

							$textUrl = $link->children() ? $link->children(0)->plaintext : $link->plaintext;
							$textUrl = $this->clean( $textUrl );
							$links[] = array(
								'text' => $textUrl,
								'url' => $this->clean( urldecode($link->href) ),
							);
						}

						$results[] = array(
							'image' => $this->getImageName($text),
							'content' => $this->getContent($text),
							'urls' => $links,
							'city' => $cityName,
							'activity' => $activityName,
						);
					}
				}
			}
		}
		// save content as json
		file_put_contents($location, json_encode($results));
	}

	/**
	 * 
	 */
	protected function getImageName($text)
	{
		preg_match('/([^\s|\-]*)/', $text, $matches);
		return $matches[1];
	}

	/**
	 *
	 */
	protected function getContent($text)
	{
		$patterns = array(
			'/gif\s\s-\s\s(.*)/',
			'/gif\s\-\s(.*)/',
			'/gif\-\s(.*)/',
			'/gif\s(.*)/',
		);

		foreach ($patterns as $pattern) {
			preg_match($pattern, $text, $matches);

			if ($matches) break;
		}

		if (!$matches) {
			var_dump($text); die();
		}

		return $matches[1];
	}

	/**
	 * Clean city name 
	 *
	 * @param String $name
	 * @return String
	 */
	protected function cleanCityName($name)
	{
		$name = preg_replace('/City\s\d+\:\s(.*)/', '${1}', $name);
		return $this->clean($name);
	}

	/**
	 * Remove special characters from text
	 * 
	 * @param String $text
	 * @return String
	 */
	protected function clean($text) 
	{
		$text = preg_replace('/\xC2\xA0/','',$text); // remove &nbsp;
		$text = html_entity_decode($text);
		$text = trim($text);
		// $text = str_replace("  ", " ", $text);
		// $text = str_replace("  ", " ", $text);
		// $text = str_replace("  ", " ", $text);
		return $text;
	}

}