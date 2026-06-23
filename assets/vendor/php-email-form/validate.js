/**
* PHP Email Form Validation & Formspree Integration - v3.11
* URL: https://bootstrapmade.com/php-email-form/
* Author: BootstrapMade.com
* Modified for Formspree and client-side validation
*/
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach( function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;

      let action = thisForm.getAttribute('action');
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if( ! action ) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }

      // Hide messages and show loading
      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

      // Client-side Validation
      let nameField = thisForm.querySelector('[name="name"]');
      let emailField = thisForm.querySelector('[name="email"]');
      let subjectField = thisForm.querySelector('[name="subject"]');
      let messageField = thisForm.querySelector('[name="message"]');

      if (nameField && nameField.value.trim().length < 3) {
        displayError(thisForm, 'Name must be at least 3 characters long.');
        return;
      }

      if (emailField) {
        let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(emailField.value.trim())) {
          displayError(thisForm, 'Please enter a valid email address.');
          return;
        }
      }

      if (subjectField && subjectField.value.trim().length < 4) {
        displayError(thisForm, 'Subject must be at least 4 characters long.');
        return;
      }

      if (messageField && messageField.value.trim().length < 10) {
        displayError(thisForm, 'Message must be at least 10 characters long.');
        return;
      }

      let formData = new FormData( thisForm );

      if ( recaptcha ) {
        if(typeof grecaptcha !== "undefined" ) {
          grecaptcha.ready(function() {
            try {
              grecaptcha.execute(recaptcha, {action: 'php_email_form_submit'})
              .then(token => {
                formData.set('recaptcha-response', token);
                php_email_form_submit(thisForm, action, formData);
              })
            } catch(error) {
              displayError(thisForm, error);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha javascript API url is not loaded!')
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });

  function php_email_form_submit(thisForm, action, formData) {
    let isFormspree = action.includes('formspree.io');
    let headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (isFormspree) {
      headers['Accept'] = 'application/json';
    }

    fetch(action, {
      method: 'POST',
      body: formData,
      headers: headers
    })
    .then(response => {
      if (response.ok) {
        return response.json().catch(() => response.text());
      } else {
        return response.json().then(data => {
          let errorMsg = '';
          if (data && data.errors) {
            errorMsg = data.errors.map(err => err.message).join(', ');
          } else if (data && data.error) {
            errorMsg = data.error;
          }
          throw new Error(errorMsg || `${response.status} ${response.statusText}`);
        }).catch((e) => {
          throw new Error(e.message || `${response.status} ${response.statusText}`);
        });
      }
    })
    .then(data => {
      thisForm.querySelector('.loading').classList.remove('d-block');
      
      if (!isFormspree) {
        if (typeof data === 'string' && data.trim() !== 'OK') {
          throw new Error(data ? data : 'Form submission failed and no error message returned from: ' + action);
        }
      }
      
      thisForm.querySelector('.sent-message').classList.add('d-block');
      thisForm.reset();
    })
    .catch((error) => {
      displayError(thisForm, error.message || error);
    });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    thisForm.querySelector('.error-message').innerHTML = error;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();
