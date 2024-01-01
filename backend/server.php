<?php
session_start();

// File paths
$historyFilePath = 'history.xml'; // Assuming the history.xml is in the same folder

// Capture start time if not set
if (!isset($_SESSION['form_start_time'])) {
    $_SESSION['form_start_time'] = time();
}

// Read existing history data
$historyData = file_exists($historyFilePath) ? simplexml_load_file($historyFilePath) : null;

// Handle GET request to fetch history
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if XML file is missing
    if ($historyData === null) {
        http_response_code(505); // Internal Server Error
        exit;
    }

    // Check if history is empty
    if ($historyData->count() === 0) {
        http_response_code(204); // No Content
        exit;
    }

    // Return history data as XML
    header('Content-Type: application/xml');
    echo $historyData->asXML();
    exit;
}

// Handle POST request to save new entry
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read input data from the request
    $postData = json_decode(file_get_contents('php://input'), true);
	
	// Validate that entries are not empty
    if (empty($postData['first_name']) || empty($postData['last_name']) || empty($postData['mail']) || empty($postData['phone']) || empty($postData['topic'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Empty entries are not allowed']);
        exit;
    }

    /// Check for duplicates
	foreach ($historyData->entry as $entry) {
		// Check if the key exists before accessing it
		if (
			isset($postData['email']) &&
			strtolower($entry->mail) === strtolower($postData['email']) &&
			(string)$entry->phone === $postData['phone'] &&
			(string)$entry->topic === $postData['topic']
		) {
			http_response_code(400); // Bad Request
			echo json_encode(['error' => 'Duplicate entry']);
			exit;
		}
	}


    // Limit the number of saved requests to 10
    if ($historyData->count() >= 10) {
        unset($historyData->entry[0]); // Remove the oldest request if there are already 10
    }

    // Add the new entry to the history data
    $newEntry = $historyData->addChild('entry');
	//$newEntry->addChild('id', $uniqueId); // Add unique ID
    $newEntry->addChild('date', date('Y-m-d H:i:s'));
    $newEntry->addChild('first_name', $postData['first_name']);
    $newEntry->addChild('middle_name', $postData['middle_name']);
    $newEntry->addChild('last_name', $postData['last_name']);
    $newEntry->addChild('mail', $postData['mail']);
    $newEntry->addChild('phone', $postData['phone']);
    $newEntry->addChild('topic', $postData['topic']);
	$newEntry->addChild('content', $postData['content']);
	
	 // Calculate elapsed time and add it to the entry
    $elapsedTime = time() - $_SESSION['form_start_time'];
	
	function formatElapsedTime($seconds)
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $remainingSeconds = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $remainingSeconds);
    }
	
	$formattedElapsedTime = formatElapsedTime($elapsedTime);
	
    $newEntry->addChild('elapsed_time', $formattedElapsedTime);

    // Save the updated history data to the file
    $historyData->asXML($historyFilePath);

    // Return success response
    echo json_encode(['success' => true]);
}
?>
