'use strict';
console.log("SCRIPT LOADED");

const forms = document.querySelectorAll('.needs-validation');

console.log("FORMS FOUND:", forms.length);

(() => {
 const forms = document.querySelectorAll('.needs-validation');

Array.from(forms).forEach(form => {
 form.addEventListener('submit', event => {
 if (!form.checkValidity()) {
 event.preventDefault();
 event.stopPropagation();
 }

 form.classList.add('was-validated');
 }, false);
 });
})();