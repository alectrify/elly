const urlSections = window.location.pathname.split('/');
const id = urlSections[urlSections.length - 3];
const batchNum = urlSections[urlSections.length - 2];
const pageNum = urlSections[urlSections.length - 1];

const hasInsurance = $('#hasInsurance');
const insuranceFields = $('#insuranceFields');
const pdfBox = $('#pdfCanvas');

$(document).ready(function () {
    $('#batchDisplay').text(`${parseInt(batchNum)}`);
    $('#editForm').attr('action', `/api/submit/${id}/${batchNum}/${pageNum}`);
    $('input[type=text]').css('background-color', '#fff3cd');

    hasInsurance.click(function () {
        if ($(this).is(':checked')) {
            insuranceFields.show();
        } else {
            insuranceFields.hide();
            $('#insuranceNum').val('');
            $('#insuranceName').val('');
        }
    });

    $('#fixPDF').click(function () {
        const pdfBoxRect = document.getElementById('pdfBox').getBoundingClientRect();
        const pdfBoxLeft = pdfBoxRect.left;
        const pdfBoxTop = pdfBoxRect.top;

        $(this).text($(this).text() === 'Toggle: Fix PDF Position' ? 'Toggle: Unfix PDF Position' : 'Toggle: Fix PDF Position');

        pdfBox.toggleClass('position-fixed');
        pdfBox.toggleClass('enlarge');
        pdfBox.css('top', pdfBoxTop);
        pdfBox.css('left', pdfBoxLeft);

    });
});