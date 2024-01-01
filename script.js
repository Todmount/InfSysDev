function showCustomAlert(message, focusField) {
    // Create and append the backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    document.body.appendChild(backdrop);

    var customModal = document.createElement('div');
    customModal.className = 'custom-modal';
    customModal.innerHTML = '<p>' + message + '</p><span class="close-button">&times;</span>';
    document.body.appendChild(customModal);

    // Add event listener for manual close
    var closeButton = customModal.querySelector('.close-button');
    closeButton.addEventListener('click', function () {
        document.body.removeChild(customModal);
        document.body.removeChild(backdrop);

        // Set focus on the specified field
        if (focusField) {
            focusField.focus();
        }
    });
}

function closeHistoryModal() {
    var historyModal = document.getElementById('historyModal');
	historyModal.style.display = 'none';
}

function closeModal() {
    var modal = document.getElementById('requestModal');

    // Check if the modal element exists before trying to access its properties
    if (modal) {
        var mainForm = document.getElementById('reg_form');

        // Clear main form fields
        mainForm.reset();

        modal.style.display = 'none';

        // Reset the timer only if the form hasn't been reset already
        if (!isFormReset) {
            secondsRemaining = 0;
            isFormReset = true;
        }
    }
}

// Function to fetch and display real-time time information
function fetchAndDisplayTime() {
    fetch("http://worldtimeapi.org/api/timezone/Europe/Kyiv")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Parse the datetime string using Date object
            const datetime = new Date(data.utc_datetime);

            // Format the time in Ukrainian
            const formattedTime = datetime.toLocaleString('uk-UA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });

            // Update the HTML to display the formatted time
            const timeContainer = document.getElementById('timeContainer');
            if (timeContainer) {
                timeContainer.innerHTML = `<p><strong>Поточний час:</strong> ${formattedTime}</p>`;
            }
        })
        .catch(error => console.error('Error fetching time:', error));
}

document.addEventListener('DOMContentLoaded', function () {
	
	// Fetch and display time initially
    fetchAndDisplayTime();
    // Set up an interval to fetch and display time every 60 seconds (adjust as needed)
    setInterval(fetchAndDisplayTime, 60000); // 60000 milliseconds = 60 seconds
	
    var form = document.getElementById('reg_form');
    var form_obj = form.elements;
	
	var historyContainer = document.getElementById('historyContainer');
	historyContainer.style.display = 'none';
	
	// Fetch the JSON file containing the options for "Тематика"
    $.ajax({
		url: 'http://localhost:8000/categories.json',
		type: 'GET',
		dataType: 'json',
		success: function(options) {
			var categorySelect = document.getElementById('category');
			options.forEach(option => {
				var optionElement = document.createElement('option');
				optionElement.value = option.value;
				optionElement.textContent = option.label;
				categorySelect.appendChild(optionElement);
			});
		},
		error: function(xhr, status, error) {
			console.error('Error fetching subject options:', error);
			showCustomAlert("Помилка зчитування категорій");
		}
	});
	
	// jQuery code for the API request
	const settings = {
		async: true,
		crossDomain: true,
		url: 'https://world-clock.p.rapidapi.com/json/est/now',
		method: 'GET',
		headers: {
			'X-RapidAPI-Key': '7f691595b7msh610fc5e56304f5dp1bfa0djsn644065da1add',
			'X-RapidAPI-Host': 'world-clock.p.rapidapi.com'
		}
	};

	$.ajax(settings)
		.done(function (response) {
			console.log('API is working');
			$('#errorMessage').hide();
			// Handle the API response here
		})
		.fail(function (xhr, textStatus, errorThrown) {
			if (xhr.status === 503) {
				console.error('Service temporarily unavailable. Please try again later.');
				// Display the error message by showing the hidden element
				$('#errorMessage').show();
			} else {
				console.error('Error:', textStatus, errorThrown);
			}
		});

	//form_obj.phone.value = '+380';
	var phoneInput = form_obj.phone;
    phoneInput.addEventListener('input', function () {
        // Remove non-numeric characters from the input value
        phoneInput.value = phoneInput.value.replace(/\D/g, '');
		
		// Ensure that the phone number starts with "+380"
		var numericValue = phoneInput.value;
        if (!numericValue.startsWith('380')) {
            // If the user removes the "+380", add it back
            numericValue = '380' + numericValue;

            // Update the input value
            phoneInput.value = numericValue;
        } else {
            // If the user has already included "+380", update the input value
            phoneInput.value = numericValue;
        }
		
    });

    // Disable browser's default validation
    form.setAttribute('novalidate', true);

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const phonePattern = /380\d{9}$/;
        var ok = true; // Assume validation is successful by default

        // Custom validation logic
        if (form_obj.last_name.value.trim() === '') {
            showCustomAlert('Будь ласка, введіть своє прізвище', form_obj.last_name);
            ok = false;
        } else if (form_obj.first_name.value.trim() === '') {
            showCustomAlert('Будь ласка, введіть своє ім\'я', form_obj.first_name);
            ok = false;
        } else if (form_obj.middle_name.value.trim() === '') {
            showCustomAlert('Будь ласка, введіть своє по батькові', form_obj.middle_name);
            ok = false;
        } else if (checkEmail(form_obj.email.value.trim())) {
            showCustomAlert('Невірна адреса електронної пошти', form_obj.email);
            ok = false;
        } else if (!phonePattern.test(form_obj.phone.value.trim())) {
            showCustomAlert('Недійсний номер телефону. Він має бути формату 380XXXXXXXXX', 
			form_obj.phone);
            ok = false;
        } else if (form_obj.topic.value.trim().length < 1) {
            showCustomAlert('Будь ласка, введіть тему.', form_obj.topic);
            ok = false;
        } else if (form_obj.content.value.trim().length < 10) {
            showCustomAlert('Будь ласка, введіть принаймні 10 символів у зверненні'), 
			form_obj.content;
            ok = false;
        } else if(!agree.checked){
			showCustomAlert('Будь ласка, погодьтеся з умовами', form_obj.agree);
			ok = false;
		}

        // If everything is ok, submit the form
        if (ok) {
            saveAndShowInfo(form_obj);
        }

        return false; // Prevent the default form submission behavior
    });

    // Add an event listener for the historyButton
    var historyButton = document.getElementById('historyButton');
    historyButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Stop event propagation
        event.preventDefault(); // Prevent the default form submission
        fetchHistoryFromServer(); // Fetch history before displaying it
    });

    // Function to fetch history from the server
	function fetchHistoryFromServer() {
		$.ajax({
			url: 'backend/server.php',
			type: 'GET',
			dataType: 'xml',
			success: function (historyData) {
				// Check if XML file is missing
				if (historyData === null) {
					showCustomAlert('Помилка 505. Відсутній файл для зберігання історії');
					return;
				}

				// Check if history is empty
				if ($(historyData).find('entry').length === 0) {
					showCustomAlert('Історія звернень відсутня');
					return;
				}

				showHistory(historyData);
			},
			error: function (xhr, status, error) {
				console.error('Error fetching history:', error);
				showCustomAlert('Помилка отримання історії');
			}
		});
	}


    // Function to display history on the client side
	function showHistory(historyData) {
		var historyModal = document.getElementById('historyModal');
		historyModal.style.display = 'block';

		var historyContent = document.getElementById('historyContent');
		historyContent.innerHTML = ''; // Clear previous content

		if (historyData.getElementsByTagName('entry').length > 0) { // Check if historyData (local) has entries
			// Display the last three history entries
			var entries = historyData.getElementsByTagName('entry');
			var start = Math.max(entries.length - 3, 0); // Start index for the loop
			for (var i = entries.length - 1; i >= start; i--) {
				var entry = entries[i];
				historyContent.innerHTML += '<p>' +
					'<strong>Дата:</strong> ' + entry.getElementsByTagName('date')[0].textContent +
					'<br><strong>ФІО:</strong> ' + entry.getElementsByTagName('first_name')[0].textContent + ' ' +
					entry.getElementsByTagName('middle_name')[0].textContent + ' ' +
					entry.getElementsByTagName('last_name')[0].textContent +
					'<br><strong>Тема:</strong> ' + entry.getElementsByTagName('topic')[0].textContent +
					'<br><strong>Email:</strong> ' + entry.getElementsByTagName('mail')[0].textContent +
					'<br><strong>Телефон:</strong> ' + entry.getElementsByTagName('phone')[0].textContent +
					'</p>';
			}
		} else {
			console.error('Invalid historyData:', historyData);
			showCustomAlert('Помилка формату історії');
		}
	}

	
	function checkEmail(email) {
		var banList = ['mail.ru', 'yandex.ru', 'list.ru'];
		for (var i = 0; i < banList.length; i++) {
			if (email.endsWith(banList[i])) {
				showCustomAlert("Домен: @" + banList[i] + ' заборонено');
				return true;
			}
		}
		if (email.length < 6) {
			return true;
		}
		var posA = email.indexOf('@');
		if (posA < 1) {
			return true;
		}
		var posDot = email.indexOf('.', posA);
		if (posDot <= (posA + 1)) {
			return true;
		}

		return false;
	}

	function win_info(frm) {
		var modal = document.getElementById('requestModal');
		var modalContent = document.getElementById('modalContent');
		var timerSpan = document.getElementById('timer');

		modalContent.innerHTML = ''; // Clear previous content

		var dt = new Date();
		modalContent.innerHTML += '<p>' + dt.toUTCString() + '</p>';
		var els = frm;
		for (var i = 0; i < els.length; i++) {
			if (els[i].type !== 'button' && els[i].type !== 'checkbox') {
				var lb = get_label(els[i]);
				if (lb) {
					modalContent.innerHTML += '<p><strong>' + lb.innerText + ':</strong> ' + els[i].value + '</p>';
				}
			}
		}

		modal.style.display = 'block';
		// timer for closing
		secondsRemaining = 15;
		timerSpan.textContent = secondsRemaining;

		var countdownInterval = setInterval(function () {
			secondsRemaining--;
			timerSpan.textContent = secondsRemaining;

			if (secondsRemaining <= 0) {
				clearInterval(countdownInterval);
				closeModal(); // Close the modal when the countdown reaches 0
			}
		}, 1000);

		// Reset the form reset flag when the timer is completed
		isFormReset = false;
	}
	
// saving data //

	var data = [];

	function saveAndShowInfo(form_obj) {
		if (save_data(form_obj)) {
			saveToServer(form_obj);
			win_info(form_obj);
			//fetchHistoryFromServer(); // Reload history after saving new data
		}
	}
	
	function saveToServer(form_obj) {
		$.ajax({
			url: 'backend/server.php',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				date: new Date().toLocaleString(),
				first_name: form_obj.first_name.value.trim(),
				middle_name: form_obj.middle_name.value.trim(),
				last_name: form_obj.last_name.value.trim(),
				mail: form_obj.email.value.trim(),
				phone: form_obj.phone.value.trim(),
				topic: form_obj.topic.value.trim(),
				content: form_obj.content.value.trim()
			}),
			success: function (response) {
				console.log('Data saved successfully:', response);
			},
			error: function (xhr, status, error) {
				console.error('Error saving data:', error);
				showCustomAlert('Помилка збереження даних');
			}
		});
	}
	
	function save_data(form) {
		var obj = {
			date: new Date().toLocaleString(),
			first_name: form.first_name.value.trim(),
			middle_name: form.middle_name.value.trim(),
			last_name: form.last_name.value.trim(),
			mail: form.email.value.trim(),
			phone: form.phone.value.trim(),
			topic: form.topic.value.trim()
		};
		// Check for duplicates (local)
		for (var i = 0; i < data.length; i++) {
			if (
				data[i].mail.toLowerCase() === obj.mail.toLowerCase() &&
				data[i].phone === obj.phone &&
				data[i].emali === obj.email &&
				data[i].topic === obj.topic
			) {
				showCustomAlert('Ви вже зареєстували подібне звернення. Будь ласка, зачекайте, з Вами обов\'язокво зв\'яжуться');
				return false;
			}
		}
		// Limit the number of saved requests (local) to three
		if (data.length >= 3) {
			data.shift(); // Remove the oldest request if there are already three
		}
		data.push(obj);
		return true;
	}

	function saveToLocalStorage(data) {
		localStorage.setItem('formData', JSON.stringify(data));
	}
	
// loading data //

	function loadFromLocalStorage() {
		var storedData = localStorage.getItem('formData');
		if (storedData) {
			return JSON.parse(storedData);
		}
		return [];
	}

	function get_label(el) {
		var lbl = el.labels[0];

		if (!lbl && el.id) {
			var form = el.form;
			lbl = form.querySelector('label[for="' + el.id + '"]');
		}

		return lbl;
	}
	
});